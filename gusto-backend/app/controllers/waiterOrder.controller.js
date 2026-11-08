// Waiter orders: a waiter sends a table's order from the tablet; it appears live on the cashier
// POS, where the cashier loads it into the cart, takes payment and prints (the normal sale).
// Statuses: pending → accepted (became sale #orderId) | rejected (by cashier) | cancelled (by waiter)
const db = require("../models/db");

const q = (sql, params = []) => new Promise((resolve, reject) => db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

const parseRow = (r) => {
  let items = [];
  try {
    items = JSON.parse(r.items || "[]");
  } catch (_) {}
  const total = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
  return { ...r, items, total };
};

const SELECT = `
  SELECT w.*, s.fullName AS waiterName, h.fullName AS handledByName, o.orderNumber
  FROM WaiterOrders w
  JOIN Staff s ON s.idStaff = w.waiterId
  LEFT JOIN Staff h ON h.idStaff = w.handledBy
  LEFT JOIN Orders o ON o.idOrder = w.orderId`;

const getOne = async (id) => {
  const rows = await q(`${SELECT} WHERE w.idWaiterOrder = ?`, [id]);
  return rows[0] ? parseRow(rows[0]) : null;
};

// Tell the cashier POS and the waiters' tablets
const broadcast = (req, event, payload) => {
  const io = req.app.get("io");
  if (!io) return;
  io.to("cashier").emit(event, payload);
  io.to("waiter").emit(event, payload);
};

exports.create = async (req, res) => {
  try {
    const tableNumber = String(req.body.tableNumber ?? "").trim();
    if (!tableNumber) return res.status(400).json({ message: "اختر رقم الطاولة" });
    if (tableNumber.length > 20) return res.status(400).json({ message: "رقم الطاولة طويل جداً" });
    const raw = Array.isArray(req.body.items) ? req.body.items : [];
    if (!raw.length) return res.status(400).json({ message: "الطلب فارغ — أضف صنفاً واحداً على الأقل" });
    if (raw.length > 100) return res.status(400).json({ message: "عدد الأصناف كبير جداً" });

    // Same checks and prices as a cashier sale (active dish, valid size, whole quantities)
    const { priceOrder } = require("./order.controller");
    const priced = await priceOrder(
      {
        orderType: "cashier",
        saleType: "cash",
        discount: 0,
        orderItems: raw.map((i) => ({
          menuItemId: i.menuItemId,
          itemSizeId: i.itemSizeId || null,
          quantity: i.quantity,
          specialInstructions: String(i.specialInstructions || "").trim().slice(0, 255) || null,
        })),
      },
      req.userRole,
    );
    if (priced.error) return res.status(priced.status || 400).json({ message: priced.error });

    const names = await q("SELECT idMenuItem, itemName, categoryId FROM MenuItems WHERE idMenuItem IN (?)", [priced.items.map((i) => i.menuItemId)]);
    const byId = new Map(names.map((n) => [n.idMenuItem, n]));
    const items = priced.items.map((i) => ({
      menuItemId: i.menuItemId,
      itemSizeId: i.itemSizeId,
      quantity: i.quantity,
      specialInstructions: i.specialInstructions || null,
      itemName: byId.get(i.menuItemId)?.itemName || "",
      categoryId: byId.get(i.menuItemId)?.categoryId ?? null,
      sizeName: i.sizeName || null,
      price: i.price,
    }));
    const notes = String(req.body.notes || "").trim().slice(0, 500) || null;
    const result = await q("INSERT INTO WaiterOrders (waiterId, tableNumber, notes, items) VALUES (?, ?, ?, ?)", [req.userId, tableNumber, notes, JSON.stringify(items)]);
    const row = await getOne(result.insertId);
    broadcast(req, "waiter_order_new", row);
    res.status(201).json(row);
  } catch (e) {
    console.error("waiter order create:", e);
    res.status(500).json({ message: "تعذّر إرسال الطلب" });
  }
};

// Cashier POS: orders waiting (and, with ?status=all, today's recent ones)
exports.list = async (req, res) => {
  try {
    const status = String(req.query.status || "pending");
    const rows =
      status === "all"
        ? await q(`${SELECT} WHERE w.createdAt >= NOW() - INTERVAL 18 HOUR ORDER BY w.idWaiterOrder DESC LIMIT 100`)
        : await q(`${SELECT} WHERE w.status = ? ORDER BY w.idWaiterOrder ASC LIMIT 100`, [status]);
    res.json(rows.map(parseRow));
  } catch (e) {
    res.status(500).json({ message: "تعذّر تحميل طلبات النُدُل" });
  }
};

// Waiter tablet: my orders of the last hours, newest first
exports.mine = async (req, res) => {
  try {
    const rows = await q(`${SELECT} WHERE w.waiterId = ? AND w.createdAt >= NOW() - INTERVAL 18 HOUR ORDER BY w.idWaiterOrder DESC LIMIT 50`, [req.userId]);
    res.json(rows.map(parseRow));
  } catch (e) {
    res.status(500).json({ message: "تعذّر تحميل طلباتك" });
  }
};

exports.reject = async (req, res) => {
  try {
    const reason = String(req.body.reason || "").trim().slice(0, 255) || null;
    const r = await q("UPDATE WaiterOrders SET status = 'rejected', rejectReason = ?, handledBy = ?, handledAt = NOW() WHERE idWaiterOrder = ? AND status = 'pending'", [
      reason,
      req.userId,
      req.params.id,
    ]);
    if (!r.affectedRows) return res.status(409).json({ message: "هذا الطلب لم يعد بانتظار الكاشير" });
    const row = await getOne(req.params.id);
    broadcast(req, "waiter_order_updated", row);
    res.json(row);
  } catch (e) {
    res.status(500).json({ message: "تعذّر رفض الطلب" });
  }
};

// The waiter withdraws an order the cashier hasn't taken yet (admins/supervisors may too)
exports.cancel = async (req, res) => {
  try {
    const own = ["admin", "supervisor"].includes(req.userRole) ? "" : " AND waiterId = ?";
    const params = own ? [req.params.id, req.userId] : [req.params.id];
    const r = await q(`UPDATE WaiterOrders SET status = 'cancelled', handledAt = NOW() WHERE idWaiterOrder = ? AND status = 'pending'${own}`, params);
    if (!r.affectedRows) return res.status(409).json({ message: "لا يمكن إلغاء هذا الطلب — ربما استلمه الكاشير" });
    const row = await getOne(req.params.id);
    broadcast(req, "waiter_order_updated", row);
    res.json(row);
  } catch (e) {
    res.status(500).json({ message: "تعذّر إلغاء الطلب" });
  }
};

// ---- used by the sale (order.controller create) ----

/** Reserve a pending waiter order for this sale; false when it was already taken/cancelled */
exports.claim = async (id, userId) => {
  const r = await q("UPDATE WaiterOrders SET status = 'accepted', handledBy = ?, handledAt = NOW() WHERE idWaiterOrder = ? AND status = 'pending'", [userId, id]);
  return r.affectedRows === 1;
};

/** The sale failed: put the waiter order back in the queue */
exports.release = (id) => q("UPDATE WaiterOrders SET status = 'pending', handledBy = NULL, handledAt = NULL WHERE idWaiterOrder = ? AND status = 'accepted' AND orderId IS NULL", [id]).catch(() => {});

/** The sale was saved: link it and tell everyone */
exports.complete = async (req, id, orderId) => {
  await q("UPDATE WaiterOrders SET orderId = ? WHERE idWaiterOrder = ?", [orderId, id]);
  broadcast(req, "waiter_order_updated", await getOne(id));
};
