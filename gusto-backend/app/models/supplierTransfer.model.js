const db = require("./db");
const { todayBusinessDate, businessWindow } = require("../services/businessDay");

const SupplierTransfer = {};

SupplierTransfer.create = (data, result) => {
  const row = {
    fromSupplierId: data.fromSupplierId,
    toSupplierId: data.toSupplierId,
    amount: data.amount,
    transferDate: data.transferDate || todayBusinessDate(),
    notes: data.notes || null,
    recordedBy: data.recordedBy || null
  };
  db.query("INSERT INTO SupplierTransfers SET ?", row, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { idSupplierTransfer: res.insertId, ...row });
  });
};

SupplierTransfer.getBySupplier = (supplierId, result) => {
  db.query(
    `SELECT st.*, 
            fs.supplierName AS fromSupplierName,
            ts.supplierName AS toSupplierName,
            s.fullName AS recordedByName
     FROM SupplierTransfers st
     INNER JOIN Suppliers fs ON st.fromSupplierId = fs.idSupplier
     INNER JOIN Suppliers ts ON st.toSupplierId = ts.idSupplier
     LEFT JOIN Staff s ON st.recordedBy = s.idStaff
     WHERE st.fromSupplierId = ? OR st.toSupplierId = ?
     ORDER BY st.transferDate DESC, st.idSupplierTransfer DESC`,
    [supplierId, supplierId],
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
 * Get total transferred OUT from a supplier (reduces their debt).
 */
SupplierTransfer.getTotalOut = (supplierId, result) => {
  db.query(
    `SELECT COALESCE(SUM(amount), 0) AS totalOut
     FROM SupplierTransfers WHERE fromSupplierId = ?`,
    [supplierId],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, parseFloat(rows[0]?.totalOut || 0));
    }
  );
};

/**
 * Get total transferred IN to a supplier (increases their debt).
 */
SupplierTransfer.getTotalIn = (supplierId, result) => {
  db.query(
    `SELECT COALESCE(SUM(amount), 0) AS totalIn
     FROM SupplierTransfers WHERE toSupplierId = ?`,
    [supplierId],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, parseFloat(rows[0]?.totalIn || 0));
    }
  );
};

module.exports = SupplierTransfer;
