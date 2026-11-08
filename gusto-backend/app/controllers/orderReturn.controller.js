const db = require("../models/db");
const OrderReturn = require("../models/orderReturn.model");

// Self-healing: ensure tables exist
let _tablesChecked = false;
function ensureTables() {
  if (_tablesChecked) return;
  _tablesChecked = true;
  db.query(`CREATE TABLE IF NOT EXISTS OrderReturns (
    idOrderReturn INT NOT NULL AUTO_INCREMENT,
    orderId INT NOT NULL,
    returnDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processedBy INT DEFAULT NULL,
    returnType ENUM('refund','exchange','waste') NOT NULL DEFAULT 'refund',
    refundMethod ENUM('cash','credit') NOT NULL DEFAULT 'cash',
    customerId INT DEFAULT NULL,
    totalRefundAmount DECIMAL(14,2) NOT NULL DEFAULT 0,
    notes TEXT DEFAULT NULL,
    dailyReceiptId INT DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idOrderReturn)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, (err) => {
    if (err) console.warn('[orderReturn] Could not create OrderReturns:', err.code);
  });
  db.query(`CREATE TABLE IF NOT EXISTS OrderReturnItems (
    idOrderReturnItem INT NOT NULL AUTO_INCREMENT,
    orderReturnId INT NOT NULL,
    orderItemId INT DEFAULT NULL,
    menuItemId INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    refundAmount DECIMAL(14,2) NOT NULL DEFAULT 0,
    disposition ENUM('wasted','returned_to_stock') NOT NULL DEFAULT 'wasted',
    replacementMenuItemId INT DEFAULT NULL,
    replacementItemSizeId INT DEFAULT NULL,
    replacementQuantity INT DEFAULT NULL,
    replacementPrice DECIMAL(14,2) DEFAULT NULL,
    PRIMARY KEY (idOrderReturnItem)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, (err) => {
    if (err) console.warn('[orderReturn] Could not create OrderReturnItems:', err.code);
  });
}
ensureTables();

/**
 * POST /api/order-returns
 * Body: { orderId, refundMethod: 'cash'|'credit', customerId?, notes?, items: [...] }
 * Each item: { orderItemId, quantity, disposition, replacementMenuItemId?, replacementItemSizeId?, replacementQuantity? }
 *
 * A return is an event of the shift it happens in; the original order keeps its total so
 * closed shifts stay as posted. Everything below runs in one transaction:
 *  - refund per item = what the customer paid for it (line price × the order's discount ratio)
 *  - quantity limited to what is still on the order line (earlier returns are split off)
 *  - replacements priced from the menu
 *  - kitchen portions restored / used
 * Shift close posts it: Dr revenue, Cr cash or receivables (replacements credited to revenue).
 */
exports.create = (req, res) => {
  const { orderId, items } = req.body;
  if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "orderId and items[] are required." });
  }
  const refundMethod = req.body.refundMethod === "credit" ? "credit" : "cash";
  const round2 = (n) => Math.round(n * 100) / 100;

  db.getConnection((errConn, conn) => {
    if (errConn) return res.status(500).json({ message: errConn.message });
    // Returns nothing: inside the async handler, returning mysql2's query object would be awaited and throw
    const fail = (status, message, code) => {
      conn.rollback(() => { conn.release(); res.status(status).json({ message, ...(code && { code }) }); });
    };
    const q = (sql, params) => new Promise((resolve, reject) => conn.query(sql, params, (e, r) => (e ? reject(e) : resolve(r))));

    conn.beginTransaction(async (errTx) => {
      if (errTx) { conn.release(); return res.status(500).json({ message: errTx.message }); }
      try {
        const [order] = await q(
          "SELECT o.*, (DATE(o.orderDate) = CURDATE()) AS isToday FROM Orders o WHERE o.idOrder = ? FOR UPDATE",
          [orderId]
        );
        if (!order) return fail(404, "Order not found.");
        if (order.status === "cancelled") return fail(400, "لا يمكن إرجاع طلب ملغى");
        if (!order.isToday) {
          return fail(400, "لا يمكن إرجاع طلبات من يوم سابق. الإرجاع فقط لطلبات اليوم.", "RETURN_SAME_DAY_ONLY");
        }
        const [shift] = await q("SELECT idDailyReceipt FROM DailyReceipts WHERE isClosed = 0 ORDER BY idDailyReceipt DESC LIMIT 1");
        if (!shift) return fail(400, "يجب فتح الشفت أولاً قبل تسجيل الإرجاع", "NO_OPEN_SHIFT");

        let customerId = null;
        if (refundMethod === "credit") {
          customerId = Number(req.body.customerId) || order.customerId || null;
          if (!customerId) return fail(400, "اختر العميل عند الإرجاع على الحساب");
        }

        // What the customer actually paid per dinar of item price
        const gross = Number(order.totalAmount) + Number(order.discount || 0);
        const netRatio = gross > 0 ? Number(order.totalAmount) / gross : 1;

        const lines = await q("SELECT * FROM OrderItems WHERE orderId = ? FOR UPDATE", [orderId]);
        const lineById = new Map(lines.map((l) => [l.idOrderItem, l]));
        const prepared = [];
        for (const it of items) {
          const line = lineById.get(Number(it.orderItemId));
          if (!line) return fail(400, `الصنف ${it.orderItemId} لا يتبع هذا الطلب`);
          if (["cancelled", "returned"].includes(line.status)) return fail(400, "هذا الصنف ملغى أو مُرجع مسبقاً");
          const qty = Number(it.quantity);
          if (!Number.isInteger(qty) || qty < 1) return fail(400, "كمية الإرجاع غير صحيحة");
          if (qty > line.quantity) return fail(400, `لا يمكن إرجاع أكثر من ${line.quantity} من هذا الصنف`);
          const refund = round2(Number(line.price) * qty * netRatio);

          let replacement = null;
          if (it.replacementMenuItemId) {
            const rq = Number(it.replacementQuantity) || 1;
            if (!Number.isInteger(rq) || rq < 1) return fail(400, "كمية البديل غير صحيحة");
            const [m] = await q(
              `SELECT mi.idMenuItem, mi.basePrice, mi.isActive, mi.isAvailable, c.isKitchen
               FROM MenuItems mi JOIN Categories c ON c.idCategory = mi.categoryId
               WHERE mi.idMenuItem = ?`,
              [it.replacementMenuItemId]
            );
            if (!m || !m.isActive || !m.isAvailable) return fail(400, "الصنف البديل غير متاح");
            let price = Number(m.basePrice);
            const sizeId = Number(it.replacementItemSizeId) || null;
            if (sizeId) {
              const [z] = await q("SELECT priceAdjustment FROM ItemSizes WHERE idItemSize = ? AND menuItemId = ? AND isActive = 1", [sizeId, m.idMenuItem]);
              if (!z) return fail(400, "حجم البديل غير صالح");
              price += Number(z.priceAdjustment);
            }
            replacement = { menuItemId: m.idMenuItem, sizeId, qty: rq, price: round2(price), isKitchen: !!m.isKitchen };
          }
          prepared.push({ line, qty, refund, disposition: it.disposition === "returned_to_stock" ? "returned_to_stock" : "wasted", replacement });
        }

        const refundTotal = prepared.reduce((t, p) => t + p.refund, 0);
        const replacementTotal = prepared.reduce((t, p) => t + (p.replacement ? p.replacement.price * p.replacement.qty : 0), 0);
        // Negative = the customer pays the difference for a dearer replacement
        const totalRefundAmount = round2(refundTotal - replacementTotal);
        const returnType = prepared.some((p) => p.replacement) ? "exchange"
          : prepared.every((p) => p.disposition === "wasted") ? "waste" : "refund";

        const ins = await q("INSERT INTO OrderReturns SET ?", {
          orderId: order.idOrder, returnDate: new Date(), processedBy: req.userId, returnType, refundMethod,
          customerId, totalRefundAmount, notes: req.body.notes || null, dailyReceiptId: shift.idDailyReceipt,
        });
        const returnId = ins.insertId;

        for (const p of prepared) {
          const { line, qty } = p;
          // Split the returned quantity onto its own line so item reports drop it
          if (qty === line.quantity) {
            await q("UPDATE OrderItems SET status = 'returned' WHERE idOrderItem = ?", [line.idOrderItem]);
          } else {
            await q("UPDATE OrderItems SET quantity = quantity - ? WHERE idOrderItem = ?", [qty, line.idOrderItem]);
            line.quantity -= qty;
            await q(
              `INSERT INTO OrderItems (orderId, menuItemId, itemSizeId, quantity, price, specialInstructions, status)
               VALUES (?, ?, ?, ?, ?, ?, 'returned')`,
              [order.idOrder, line.menuItemId, line.itemSizeId, qty, line.price, line.specialInstructions]
            );
          }
          if (p.disposition === "returned_to_stock") {
            await q(
              "INSERT INTO KitchenItemStock (menuItemId, quantity) VALUES (?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?",
              [line.menuItemId, qty, qty]
            );
          }
          if (p.replacement) {
            const r = p.replacement;
            if (r.isKitchen) {
              const upd = await q("UPDATE KitchenItemStock SET quantity = quantity - ? WHERE menuItemId = ? AND quantity >= ?", [r.qty, r.menuItemId, r.qty]);
              if (!upd.affectedRows) return fail(400, "الكمية غير متوفرة في مخزن المطبخ للصنف البديل", "INSUFFICIENT_KITCHEN_STOCK");
            }
            await q(
              `INSERT INTO OrderItems (orderId, menuItemId, itemSizeId, quantity, price, specialInstructions, status)
               VALUES (?, ?, ?, ?, ?, 'بديل - إرجاع', 'pending')`,
              [order.idOrder, r.menuItemId, r.sizeId, r.qty, r.price]
            );
          }
          await q(
            `INSERT INTO OrderReturnItems (orderReturnId, orderItemId, menuItemId, quantity, refundAmount, disposition,
               replacementMenuItemId, replacementItemSizeId, replacementQuantity, replacementPrice)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [returnId, line.idOrderItem, line.menuItemId, qty, p.refund, p.disposition,
             p.replacement?.menuItemId || null, p.replacement?.sizeId || null, p.replacement?.qty || null, p.replacement?.price ?? null]
          );
        }

        conn.commit((errCommit) => {
          if (errCommit) return fail(500, errCommit.message);
          conn.release();
          const io = req.app.get("io");
          if (io) {
            io.to("kitchen").emit("order_return", { orderId: order.idOrder });
            io.to("cashier").emit("order_return", { orderId: order.idOrder });
          }
          res.json({ message: "تم تسجيل الإرجاع بنجاح", return: { idOrderReturn: returnId, returnType, refundMethod }, totalRefundAmount });
        });
      } catch (e) {
        console.error("[orderReturn] Create error:", e.message);
        fail(500, e.message || "Error creating return.");
      }
    });
  });
};

/**
 * GET /api/order-returns?orderId=X
 * Get returns for a specific order, or recent returns
 */
exports.getByOrder = (req, res) => {
  const orderId = req.query.orderId || req.params.orderId;
  if (!orderId) {
    return OrderReturn.getAll(req.query.limit || 50, (err, data) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(data);
    });
  }

  OrderReturn.getByOrderId(orderId, (err, data) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(data);
  });
};

module.exports = exports;
