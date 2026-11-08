const db = require("./db");

const DailyReceipt = function(receipt) {
  this.receiptDate = receipt.receiptDate;
  this.openingCash = receipt.openingCash;
  this.totalSales = receipt.totalSales;
  this.totalExpenses = receipt.totalExpenses;
  this.closingCash = receipt.closingCash;
  this.expectedCash = receipt.expectedCash;
  this.discrepancy = receipt.discrepancy;
  this.openedBy = receipt.openedBy;
  this.closedBy = receipt.closedBy;
  this.openedAt = receipt.openedAt;
  this.closedAt = receipt.closedAt;
  this.isClosed = receipt.isClosed;
  this.notes = receipt.notes;
};

DailyReceipt.create = (newReceipt, result) => {
  db.query("INSERT INTO DailyReceipts SET ?", newReceipt, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...newReceipt });
  });
};

DailyReceipt.findById = (id, result) => {
  const query = `
    SELECT 
      dr.*,
      s1.fullName as openedByName,
      s2.fullName as closedByName
    FROM DailyReceipts dr
    LEFT JOIN Staff s1 ON dr.openedBy = s1.idStaff
    LEFT JOIN Staff s2 ON dr.closedBy = s2.idStaff
    WHERE dr.idDailyReceipt = ?
  `;
  
  db.query(query, [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.length) {
      result(null, res[0]);
      return;
    }
    result({ kind: "not_found" }, null);
  });
};

// Find open receipt by date (for getCurrent - only returns open receipts)
DailyReceipt.findByDate = (date, result) => {
  const query = `
    SELECT 
      dr.*,
      s1.fullName as openedByName,
      s2.fullName as closedByName
    FROM DailyReceipts dr
    LEFT JOIN Staff s1 ON dr.openedBy = s1.idStaff
    LEFT JOIN Staff s2 ON dr.closedBy = s2.idStaff
    WHERE dr.receiptDate = ? AND dr.isClosed = FALSE
  `;
  
  db.query(query, [date], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.length) {
      result(null, res[0]);
      return;
    }
    result({ kind: "not_found" }, null);
  });
};

// Count receipts for a specific date (for shift numbering)
DailyReceipt.countByDate = (date, result) => {
  const query = `SELECT COUNT(*) as count FROM DailyReceipts WHERE receiptDate = ?`;
  
  db.query(query, [date], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res[0].count);
  });
};

DailyReceipt.getAll = (limit = 30, result) => {
  const query = `
    SELECT 
      dr.*,
      s1.fullName as openedByName,
      s2.fullName as closedByName
    FROM DailyReceipts dr
    LEFT JOIN Staff s1 ON dr.openedBy = s1.idStaff
    LEFT JOIN Staff s2 ON dr.closedBy = s2.idStaff
    ORDER BY dr.receiptDate DESC
    LIMIT ?
  `;
  
  db.query(query, [limit], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

DailyReceipt.open = (receiptData, result) => {
  db.query("INSERT INTO DailyReceipts SET ?", receiptData, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...receiptData });
  });
};

DailyReceipt.close = (id, closingData, result) => {
  db.query(
    `UPDATE DailyReceipts SET 
      closingCash = ?,
      expectedCash = ?,
      discrepancy = ?,
      closedBy = ?,
      closedAt = NOW(),
      isClosed = TRUE,
      notes = ?
    WHERE idDailyReceipt = ?`,
    [
      closingData.closingCash,
      closingData.expectedCash,
      closingData.discrepancy,
      closingData.closedBy,
      closingData.notes,
      id
    ],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, res);
    }
  );
};

DailyReceipt.updateTotals = (id, totals, result) => {
  db.query(
    "UPDATE DailyReceipts SET totalSales = ?, totalExpenses = ?, expectedCash = openingCash + ? - ? WHERE idDailyReceipt = ?",
    [totals.totalSales, totals.totalExpenses, totals.totalSales, totals.totalExpenses, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, res);
    }
  );
};

module.exports = DailyReceipt;

