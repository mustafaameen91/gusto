const db = require("./db");

/**
 * OtherIncomes — إيرادات خارجية, linked to income-type account from chart of accounts (دليل الحسابات).
 * Table: OtherIncomes (idOtherIncome, incomeDate, amount, incomeAccountId, paymentMethod, dailyReceiptId, recordedBy, notes, createdAt)
 */
const OtherIncome = {};

OtherIncome.create = (data, result) => {
  const row = {
    incomeDate: data.incomeDate,
    amount: data.amount,
    incomeAccountId: data.incomeAccountId,
    paymentMethod: data.paymentMethod || "cash",
    dailyReceiptId: data.dailyReceiptId || null,
    recordedBy: data.recordedBy || null,
    notes: data.notes || null
  };
  db.query("INSERT INTO OtherIncomes SET ?", row, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { idOtherIncome: res.insertId, ...row });
  });
};

OtherIncome.getAll = (filters, result) => {
  let query = `
    SELECT oi.*, s.fullName AS recordedByName,
           a.name AS incomeAccountName
    FROM OtherIncomes oi
    LEFT JOIN Staff s ON s.idStaff = oi.recordedBy
    LEFT JOIN Accounts a ON a.idAccount = oi.incomeAccountId
    WHERE 1=1
  `;
  const params = [];
  if (filters.startDate) {
    query += " AND DATE(oi.incomeDate) >= ?";
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += " AND DATE(oi.incomeDate) <= ?";
    params.push(filters.endDate);
  }
  if (filters.dailyReceiptId) {
    query += " AND oi.dailyReceiptId = ?";
    params.push(filters.dailyReceiptId);
  }
  query += " ORDER BY oi.incomeDate DESC, oi.idOtherIncome DESC";
  const limit = parseInt(filters.limit, 10) || 200;
  query += " LIMIT ?";
  params.push(limit);

  db.query(query, params, (err, rows) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, rows || []);
  });
};

/**
 * List other incomes for a shift (for GL posting). Each row has incomeAccountId so we credit the correct account.
 */
OtherIncome.getListByShift = (dailyReceiptId, result) => {
  db.query(
    `SELECT idOtherIncome, amount, paymentMethod, incomeAccountId
     FROM OtherIncomes WHERE dailyReceiptId = ?`,
    [dailyReceiptId],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, rows || []);
    }
  );
};

/**
 * Sum other incomes for Box balance: shift-linked for given dailyReceiptId OR unlinked for receiptDate.
 * Used when Box has an open shift - we add cash from both sources.
 */
OtherIncome.getTotalsForBox = (receiptDate, dailyReceiptId, result) => {
  const dateStr = receiptDate ? (typeof receiptDate === "string" ? receiptDate.slice(0, 10) : receiptDate.toISOString().slice(0, 10)) : null;
  db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN paymentMethod = 'cash' THEN amount ELSE 0 END), 0) AS cashTotal,
       COALESCE(SUM(CASE WHEN paymentMethod = 'bank' THEN amount ELSE 0 END), 0) AS bankTotal,
       COALESCE(SUM(amount), 0) AS total
     FROM OtherIncomes
     WHERE (dailyReceiptId = ? OR (dailyReceiptId IS NULL AND ? IS NOT NULL AND DATE(incomeDate) = ?))`,
    [dailyReceiptId || 0, dateStr, dateStr],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      const r = rows[0] || {};
      result(null, {
        cashTotal: Number(r.cashTotal || 0),
        bankTotal: Number(r.bankTotal || 0),
        total: Number(r.total || 0)
      });
    }
  );
};

/**
 * List other incomes for Box transactions (date range). Includes both shift-linked and unlinked.
 */
OtherIncome.getListForTransactions = (startDate, endDate, result) => {
  db.query(
    `SELECT oi.idOtherIncome, oi.amount, oi.incomeDate AS date, oi.paymentMethod, oi.incomeAccountId,
            a.name AS incomeAccountName
     FROM OtherIncomes oi
     LEFT JOIN Accounts a ON a.idAccount = oi.incomeAccountId
     WHERE DATE(oi.incomeDate) >= ? AND DATE(oi.incomeDate) <= ?
     ORDER BY oi.incomeDate DESC`,
    [startDate, endDate],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, rows || []);
    }
  );
};

/**
 * Sum other incomes for a shift (for daily receipt display: expected cash = opening + sales - expenses + otherIncomesCash).
 */
OtherIncome.getTotalsByShift = (dailyReceiptId, result) => {
  db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN paymentMethod = 'cash' THEN amount ELSE 0 END), 0) AS cashTotal,
       COALESCE(SUM(CASE WHEN paymentMethod = 'bank' THEN amount ELSE 0 END), 0) AS bankTotal,
       COALESCE(SUM(amount), 0) AS total
     FROM OtherIncomes WHERE dailyReceiptId = ?`,
    [dailyReceiptId],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      const r = rows[0] || {};
      result(null, {
        cashTotal: Number(r.cashTotal || 0),
        bankTotal: Number(r.bankTotal || 0),
        total: Number(r.total || 0)
      });
    }
  );
};

module.exports = OtherIncome;
