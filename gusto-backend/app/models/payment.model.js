const db = require("./db");

/**
 * Payment model - records payment for an order (table Payments).
 * Used for GL and cash flow; one payment per order at checkout.
 */
Payment = {};

Payment.create = (payment, result) => {
  db.query("INSERT INTO Payments SET ?", payment, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { idPayment: res.insertId, ...payment });
  });
};

Payment.getByOrderId = (orderId, result) => {
  db.query(
    "SELECT * FROM Payments WHERE orderId = ?",
    [orderId],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, res.length ? res[0] : null);
    }
  );
};

/**
 * List payments with optional filters: startDate, endDate, dailyReceiptId.
 * Joins Orders to filter by shift. Uses o.orderDate for date filter (Payments may not have date columns).
 */
Payment.getAll = (filters, result) => {
  let query = `
    SELECT p.*, o.orderNumber, o.totalAmount AS orderTotal, o.dailyReceiptId, o.orderDate,
           s.fullName AS cashierName
    FROM Payments p
    INNER JOIN Orders o ON o.idOrder = p.orderId
    LEFT JOIN Staff s ON s.idStaff = p.cashierId
    WHERE 1=1
  `;
  const params = [];

  if (filters.startDate) {
    query += " AND o.orderDate >= CONCAT(?, ' 03:00:00')";
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += " AND o.orderDate < CONCAT(DATE_ADD(?, INTERVAL 1 DAY), ' 03:00:00')";
    params.push(filters.endDate);
  }
  if (filters.dailyReceiptId) {
    query += " AND o.dailyReceiptId = ?";
    params.push(filters.dailyReceiptId);
  }

  query += " ORDER BY o.orderDate DESC";
  if (filters.limit) {
    query += " LIMIT ?";
    params.push(parseInt(filters.limit, 10) || 100);
  }

  db.query(query, params, (err, rows) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, rows || []);
  });
};

module.exports = Payment;
