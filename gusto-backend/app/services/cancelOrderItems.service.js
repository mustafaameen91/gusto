const db = require("../models/db");
const { moveIngredients } = require("./recipeUsage");

const CANCEL_ROLES = ["admin", "supervisor"];
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Cancel order items as a money event (one transaction):
 *  - only admin/supervisor, and only while the order's shift is still open
 *    (after the shift is closed, use a return instead)
 *  - the order total drops by what the customer paid for the items (price after the
 *    order's discount); the discount drops in proportion so later returns stay correct
 *  - items not started yet ('pending') give back their kitchen portion and recipe
 *    ingredients, and their cost is reversed; started items count as used
 *  - when nothing is left the order becomes 'cancelled'; the payment record follows the total
 *
 * itemIds: ids to cancel, or null for every remaining item of the order.
 * Calls back (err, { orderId, cancelled, newTotal, orderStatus }); err.status is set for user errors.
 */
function cancelOrderItems(orderId, itemIds, user, callback) {
  const userError = (status, msg) => Object.assign(new Error(msg), { status });
  if (!CANCEL_ROLES.includes(user.role)) {
    return callback(userError(403, "الإلغاء مسموح للمشرف أو المدير فقط"));
  }

  db.getConnection((errConn, conn) => {
    if (errConn) return callback(errConn);
    const q = (sql, params) => new Promise((resolve, reject) => conn.query(sql, params, (e, r) => (e ? reject(e) : resolve(r))));
    const fail = (e) => { conn.rollback(() => { conn.release(); callback(e); }); };

    conn.beginTransaction(async (errTx) => {
      if (errTx) { conn.release(); return callback(errTx); }
      try {
        const [order] = await q(
          `SELECT o.*, dr.isClosed AS shiftClosed FROM Orders o
           LEFT JOIN DailyReceipts dr ON dr.idDailyReceipt = o.dailyReceiptId
           WHERE o.idOrder = ? FOR UPDATE`,
          [orderId]
        );
        if (!order) return fail(userError(404, "Order not found."));
        if (order.shiftClosed) return fail(userError(400, "شفت هذا الطلب مغلق. استخدم الإرجاع بدلاً من الإلغاء"));

        const lines = await q("SELECT * FROM OrderItems WHERE orderId = ? FOR UPDATE", [orderId]);
        const wanted = itemIds ? new Set(itemIds.map(Number)) : null;
        if (wanted) {
          for (const id of wanted) {
            if (!lines.some((l) => l.idOrderItem === id)) return fail(userError(400, `الصنف ${id} لا يتبع هذا الطلب`));
          }
        }
        const toCancel = lines.filter((l) => (!wanted || wanted.has(l.idOrderItem)) && !["cancelled", "returned"].includes(l.status));

        const total = Number(order.totalAmount);
        const discount = Number(order.discount || 0);
        const gross = total + discount;
        const netRatio = gross > 0 ? total / gross : 1;

        let netCancelled = 0;
        let discountCancelled = 0;
        for (const line of toCancel) {
          const lineGross = Number(line.price) * line.quantity;
          const lineNet = round2(lineGross * netRatio);
          netCancelled += lineNet;
          discountCancelled += round2(lineGross - lineNet);
          await q("UPDATE OrderItems SET status = 'cancelled', cancelledAt = NOW() WHERE idOrderItem = ?", [line.idOrderItem]);

          if (line.status === "pending") {
            // Not started: portion and ingredients go back, cost is reversed
            const [cat] = await q(
              "SELECT c.isKitchen FROM MenuItems m JOIN Categories c ON c.idCategory = m.categoryId WHERE m.idMenuItem = ?",
              [line.menuItemId]
            );
            if (cat && cat.isKitchen) {
              await q(
                "INSERT INTO KitchenItemStock (menuItemId, quantity) VALUES (?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?",
                [line.menuItemId, line.quantity, line.quantity]
              );
            }
            await moveIngredients(q, {
              menuItemId: line.menuItemId, itemSizeId: line.itemSizeId, quantity: line.quantity,
              direction: "restore", orderId, dailyReceiptId: order.dailyReceiptId, userId: user.id,
              note: `Cancelled item (Order #${orderId})`,
            });
          }
        }

        const newTotal = Math.max(0, round2(total - netCancelled));
        const newDiscount = Math.max(0, round2(discount - discountCancelled));
        // Returned lines were served and refunded separately: they keep the order alive
        const remaining = lines.length - toCancel.length - lines.filter((l) => l.status === "cancelled").length;
        const orderStatus = remaining <= 0 ? "cancelled" : order.status;
        await q(
          `UPDATE Orders SET totalAmount = ?, discount = ?, status = ?${orderStatus === "cancelled" ? ", cancelledAt = NOW()" : ""} WHERE idOrder = ?`,
          [newTotal, newDiscount, orderStatus, orderId]
        );
        await q("UPDATE Payments SET amountReceived = ? WHERE orderId = ?", [newTotal, orderId]);

        conn.commit((errCommit) => {
          if (errCommit) return fail(errCommit);
          conn.release();
          callback(null, { orderId: Number(orderId), cancelled: toCancel.map((l) => l.idOrderItem), newTotal, orderStatus });
        });
      } catch (e) {
        fail(e);
      }
    });
  });
}

module.exports = { cancelOrderItems };
