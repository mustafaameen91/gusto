const db = require("./db");

const OrderReturn = {};

OrderReturn.create = (data, items, result) => {
  db.getConnection((err, conn) => {
    if (err) return result(err, null);

    conn.beginTransaction((txErr) => {
      if (txErr) { conn.release(); return result(txErr, null); }

      conn.query("INSERT INTO OrderReturns SET ?", data, (errRet, retRes) => {
        if (errRet) {
          conn.rollback(() => conn.release());
          return result(errRet, null);
        }

        const returnId = retRes.insertId;

        if (!items || items.length === 0) {
          conn.commit((cErr) => {
            if (cErr) { conn.rollback(() => conn.release()); return result(cErr, null); }
            conn.release();
            result(null, { idOrderReturn: returnId, ...data });
          });
          return;
        }

        const rows = items.map(i => [
          returnId,
          i.orderItemId || null,
          i.menuItemId,
          i.quantity,
          i.refundAmount || 0,
          i.disposition || 'wasted',
          i.replacementMenuItemId || null,
          i.replacementItemSizeId || null,
          i.replacementQuantity || null,
          i.replacementPrice || null
        ]);

        conn.query(
          `INSERT INTO OrderReturnItems
           (orderReturnId, orderItemId, menuItemId, quantity, refundAmount, disposition,
            replacementMenuItemId, replacementItemSizeId, replacementQuantity, replacementPrice)
           VALUES ?`,
          [rows],
          (errItems) => {
            if (errItems) {
              conn.rollback(() => conn.release());
              return result(errItems, null);
            }
            conn.commit((cErr) => {
              if (cErr) { conn.rollback(() => conn.release()); return result(cErr, null); }
              conn.release();
              result(null, { idOrderReturn: returnId, ...data, items });
            });
          }
        );
      });
    });
  });
};

OrderReturn.getByOrderId = (orderId, result) => {
  const query = `
    SELECT
      r.*,
      s.fullName AS processedByName
    FROM OrderReturns r
    LEFT JOIN Staff s ON r.processedBy = s.idStaff
    WHERE r.orderId = ?
    ORDER BY r.returnDate DESC
  `;
  db.query(query, [orderId], (err, returns) => {
    if (err) return result(err, null);
    if (!returns || returns.length === 0) return result(null, []);

    const ids = returns.map(r => r.idOrderReturn);
    const ph = ids.map(() => "?").join(",");

    db.query(
      `SELECT ri.*, m.itemName, m2.itemName AS replacementItemName
       FROM OrderReturnItems ri
       LEFT JOIN MenuItems m ON ri.menuItemId = m.idMenuItem
       LEFT JOIN MenuItems m2 ON ri.replacementMenuItemId = m2.idMenuItem
       WHERE ri.orderReturnId IN (${ph})
       ORDER BY ri.idOrderReturnItem`,
      ids,
      (errItems, itemRows) => {
        if (errItems) return result(errItems, null);

        const itemsByReturn = {};
        (itemRows || []).forEach(i => {
          if (!itemsByReturn[i.orderReturnId]) itemsByReturn[i.orderReturnId] = [];
          itemsByReturn[i.orderReturnId].push(i);
        });

        const list = returns.map(r => ({
          ...r,
          items: itemsByReturn[r.idOrderReturn] || []
        }));

        result(null, list);
      }
    );
  });
};

OrderReturn.getAll = (limit, result) => {
  const lim = Math.min(parseInt(limit, 10) || 50, 200);
  db.query(
    `SELECT r.*, s.fullName AS processedByName, o.orderNumber
     FROM OrderReturns r
     LEFT JOIN Staff s ON r.processedBy = s.idStaff
     LEFT JOIN Orders o ON r.orderId = o.idOrder
     ORDER BY r.returnDate DESC
     LIMIT ?`,
    [lim],
    (err, rows) => {
      if (err) return result(err, null);
      result(null, rows || []);
    }
  );
};

module.exports = OrderReturn;
