const db = require("./db");

const SupplierCredit = function(credit) {
  this.supplierId = credit.supplierId;
  this.amount = credit.amount;
  this.creditDate = credit.creditDate;
  this.creditType = credit.creditType || 'credit';
  this.description = credit.description || null;
  this.purchaseId = credit.purchaseId || null;
  this.recordedBy = credit.recordedBy;
};

// Create new credit
SupplierCredit.create = (newCredit, result) => {
  db.query("INSERT INTO SupplierCredits SET ?", newCredit, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...newCredit });
  });
};

// Get all credits for a supplier
SupplierCredit.getBySupplier = (supplierId, result) => {
  const query = `
    SELECT 
      sc.*,
      s.fullName as recordedByName,
      p.purchaseNumber
    FROM SupplierCredits sc
    LEFT JOIN Staff s ON sc.recordedBy = s.idStaff
    LEFT JOIN Purchases p ON sc.purchaseId = p.idPurchase
    WHERE sc.supplierId = ?
    ORDER BY sc.creditDate DESC, sc.createdAt DESC
  `;

  db.query(query, [supplierId], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

// Get credit by ID
SupplierCredit.findById = (id, result) => {
  const query = `
    SELECT 
      sc.*,
      s.fullName as recordedByName,
      p.purchaseNumber
    FROM SupplierCredits sc
    LEFT JOIN Staff s ON sc.recordedBy = s.idStaff
    LEFT JOIN Purchases p ON sc.purchaseId = p.idPurchase
    WHERE sc.idCredit = ?
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

// Update credit
SupplierCredit.updateById = (id, credit, result) => {
  db.query(
    "UPDATE SupplierCredits SET ? WHERE idCredit = ?",
    [credit, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, { id: id, ...credit });
    }
  );
};

// Delete credit
SupplierCredit.remove = (id, result) => {
  db.query("DELETE FROM SupplierCredits WHERE idCredit = ?", [id], (err, res) => {
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

module.exports = SupplierCredit;

