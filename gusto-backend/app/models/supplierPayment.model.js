const db = require("./db");

const SupplierPayment = function(payment) {
  this.supplierId = payment.supplierId;
  this.amount = payment.amount;
  this.paymentDate = payment.paymentDate;
  this.paymentMethod = payment.paymentMethod || 'cash';
  this.notes = payment.notes || null;
  this.recordedBy = payment.recordedBy;
};

// Create new payment
SupplierPayment.create = (newPayment, result) => {
  db.query("INSERT INTO SupplierPayments SET ?", newPayment, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...newPayment });
  });
};

// Get all payments for a supplier
SupplierPayment.getBySupplier = (supplierId, result) => {
  const query = `
    SELECT 
      sp.*,
      s.fullName as recordedByName
    FROM SupplierPayments sp
    LEFT JOIN Staff s ON sp.recordedBy = s.idStaff
    WHERE sp.supplierId = ?
    ORDER BY sp.paymentDate DESC, sp.createdAt DESC
  `;

  db.query(query, [supplierId], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

// Get payment by ID
SupplierPayment.findById = (id, result) => {
  const query = `
    SELECT 
      sp.*,
      s.fullName as recordedByName
    FROM SupplierPayments sp
    LEFT JOIN Staff s ON sp.recordedBy = s.idStaff
    WHERE sp.idPayment = ?
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

// Update payment
SupplierPayment.updateById = (id, payment, result) => {
  db.query(
    "UPDATE SupplierPayments SET ? WHERE idPayment = ?",
    [payment, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, { id: id, ...payment });
    }
  );
};

// Delete payment
SupplierPayment.remove = (id, result) => {
  db.query("DELETE FROM SupplierPayments WHERE idPayment = ?", [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.affectedRows == 0) {
      result({ kind: "not_found" }, null);
      return;
    }
    result(null, res);
  });
};

module.exports = SupplierPayment;

