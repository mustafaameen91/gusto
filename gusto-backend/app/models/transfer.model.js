const db = require("./db");

const Transfer = {};

Transfer.create = (data, result) => {
  const row = {
    fromLocationId: data.fromLocationId,
    toLocationId: data.toLocationId,
    ingredientId: data.ingredientId,
    quantity: data.quantity,
    transferredBy: data.transferredBy || null,
    notes: data.notes || null
  };
  db.query("INSERT INTO Transfers SET ?", row, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { idTransfer: res.insertId, ...row });
  });
};

Transfer.getAll = (filters, result) => {
  let query = `
    SELECT t.*,
           i.ingredientName, i.unit,
           fl.name AS fromLocationName, tl.name AS toLocationName,
           s.fullName AS transferredByName
    FROM Transfers t
    INNER JOIN Ingredients i ON t.ingredientId = i.idIngredient
    INNER JOIN StorageLocations fl ON t.fromLocationId = fl.idStorageLocation
    INNER JOIN StorageLocations tl ON t.toLocationId = tl.idStorageLocation
    LEFT JOIN Staff s ON t.transferredBy = s.idStaff
    WHERE 1=1
  `;
  const params = [];
  if (filters.ingredientId) {
    query += " AND t.ingredientId = ?";
    params.push(filters.ingredientId);
  }
  if (filters.fromLocationId) {
    query += " AND t.fromLocationId = ?";
    params.push(filters.fromLocationId);
  }
  if (filters.toLocationId) {
    query += " AND t.toLocationId = ?";
    params.push(filters.toLocationId);
  }
  if (filters.startDate) {
    query += " AND DATE(t.transferredAt) >= ?";
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += " AND DATE(t.transferredAt) <= ?";
    params.push(filters.endDate);
  }
  query += " ORDER BY t.transferredAt DESC";
  if (filters.limit) {
    query += " LIMIT ?";
    params.push(parseInt(filters.limit, 10));
  }
  db.query(query, params, (err, rows) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, rows || []);
  });
};

module.exports = Transfer;
