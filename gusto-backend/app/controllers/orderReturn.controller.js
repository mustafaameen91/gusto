const db = require("../models/db");
const OrderReturn = require("../models/orderReturn.model");
const KitchenItemStock = require("../models/kitchenItemStock.model");
const DailyReceipt = require("../models/dailyReceipt.model");

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
 * Body: { orderId, returnType, refundMethod, customerId?, notes?, items: [...] }
 * Each item: { orderItemId, menuItemId, quantity, refundAmount, disposition, replacement* }
 */
exports.create = (req, res) => {
  const { orderId, items } = req.body;
  if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "orderId and items[] are required." });
  }

  // Only allow returns for today's orders — compare in MySQL to avoid timezone issues
  db.query(
    `SELECT o.*, (DATE(o.orderDate) = CURDATE()) AS isToday FROM Orders o WHERE o.idOrder = ?`,
    [orderId],
    (err, orderRows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!orderRows || orderRows.length === 0) {
        return res.status(404).json({ message: "Order not found." });
      }

      const order = orderRows[0];

      if (!order.isToday) {
        return res.status(400).json({
          message: "لا يمكن إرجاع طلبات من يوم سابق. الإرجاع فقط لطلبات اليوم.",
          code: "RETURN_SAME_DAY_ONLY"
        });
      }

      // Get current open shift
      const today = new Date().toISOString().split("T")[0];
      DailyReceipt.findByDate(today, (shiftErr, openShift) => {
        const dailyReceiptId = (openShift && !openShift.isClosed)
          ? (openShift.idDailyReceipt || openShift.id)
          : (order.dailyReceiptId || null);

        // Calculate total refund
        let totalRefundAmount = 0;
        items.forEach(i => {
          const itemRefund = parseFloat(i.refundAmount) || 0;
          const replacementCost = i.replacementPrice && i.replacementQuantity
            ? parseFloat(i.replacementPrice) * parseInt(i.replacementQuantity)
            : 0;
          totalRefundAmount += (itemRefund - replacementCost);
        });
        if (totalRefundAmount < 0) totalRefundAmount = 0;

        const hasExchange = items.some(i => i.replacementMenuItemId);
        let returnType = req.body.returnType || 'refund';
        if (hasExchange) returnType = 'exchange';
        else if (items.every(i => i.disposition === 'wasted')) returnType = 'waste';

        const returnData = {
          orderId,
          returnDate: new Date(),
          processedBy: req.body.authenticatedById || req.userId,
          returnType,
          refundMethod: req.body.refundMethod || 'cash',
          customerId: req.body.customerId || null,
          totalRefundAmount,
          notes: req.body.notes || null,
          dailyReceiptId
        };

        OrderReturn.create(returnData, items, (createErr, result) => {
          if (createErr) {
            console.error("[orderReturn] Create error:", createErr);
            return res.status(500).json({ message: createErr.message || "Error creating return." });
          }

          // Post-processing (async, non-blocking)
          processReturnEffects(orderId, items, totalRefundAmount, dailyReceiptId, req);

          res.json({
            message: "تم تسجيل الإرجاع بنجاح",
            return: result,
            totalRefundAmount
          });
        });
      });
    }
  );
};

/**
 * Handle side effects after return is created:
 * 1. Mark original order items as 'returned'
 * 2. Restore kitchen stock for returned_to_stock items
 * 3. Deduct kitchen stock for replacement items
 * 4. Adjust order total
 * 5. Add replacement OrderItems if exchange
 */
function processReturnEffects(orderId, items, totalRefundAmount, dailyReceiptId, req) {
  items.forEach(item => {
    // 1. Mark original order item as returned
    if (item.orderItemId) {
      db.query(
        `UPDATE OrderItems SET status = 'returned' WHERE idOrderItem = ? AND orderId = ?`,
        [item.orderItemId, orderId],
        (err) => { if (err) console.error("[orderReturn] Failed to mark item returned:", err); }
      );
    }

    // 2. Restore kitchen stock if returned to stock
    if (item.disposition === 'returned_to_stock' && item.menuItemId && item.quantity > 0) {
      KitchenItemStock.add(item.menuItemId, item.quantity, (err) => {
        if (err) console.error("[orderReturn] Failed to restore kitchen stock:", err);
        else console.log(`[orderReturn] Restored ${item.quantity}x menuItem ${item.menuItemId} to kitchen stock`);
      });
    }

    // 3. If exchange: deduct kitchen stock for replacement + add new OrderItem
    if (item.replacementMenuItemId && item.replacementQuantity > 0) {
      KitchenItemStock.decrease(item.replacementMenuItemId, item.replacementQuantity, (err) => {
        if (err) console.error("[orderReturn] Failed to deduct replacement stock:", err);
      });

      db.query(
        `INSERT INTO OrderItems (orderId, menuItemId, itemSizeId, quantity, price, specialInstructions, status)
         VALUES (?, ?, ?, ?, ?, 'بديل - إرجاع', 'pending')`,
        [orderId, item.replacementMenuItemId, item.replacementItemSizeId || null,
         item.replacementQuantity, item.replacementPrice || 0],
        (err) => {
          if (err) console.error("[orderReturn] Failed to add replacement OrderItem:", err);
        }
      );
    }
  });

  // 4. Adjust order total
  if (totalRefundAmount > 0) {
    db.query(
      `UPDATE Orders SET totalAmount = GREATEST(0, totalAmount - ?) WHERE idOrder = ?`,
      [totalRefundAmount, orderId],
      (err) => {
        if (err) console.error("[orderReturn] Failed to adjust order total:", err);
        else console.log(`[orderReturn] Reduced order ${orderId} total by ${totalRefundAmount}`);
      }
    );
  }

  // 5. Emit WebSocket event
  const io = req.app.get("io");
  if (io) {
    io.to("kitchen").emit("order_return", { orderId });
    io.to("cashier").emit("order_return", { orderId });
  }
}

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
