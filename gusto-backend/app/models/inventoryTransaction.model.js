const db = require("./db");

const InventoryTransaction = function(transaction) {
  this.ingredientId = transaction.ingredientId;
  this.transactionType = transaction.transactionType;
  this.quantity = transaction.quantity;
  this.costPerUnit = transaction.costPerUnit;
  this.totalCost = transaction.totalCost;
  this.orderId = transaction.orderId;
  this.recordedBy = transaction.recordedBy;
  this.notes = transaction.notes;
};

InventoryTransaction.create = (newTransaction, result) => {
  db.query("INSERT INTO InventoryTransactions SET ?", newTransaction, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...newTransaction });
  });
};

InventoryTransaction.bulkCreate = (transactions, result) => {
  if (transactions.length === 0) {
    result(null, []);
    return;
  }

  const transactionsData = transactions.map(t => [
    t.ingredientId,
    t.transactionType,
    t.quantity,
    t.costPerUnit || null,
    t.totalCost || null,
    t.orderId || null,
    t.recordedBy || null,
    t.notes || null
  ]);

  db.query(
    `INSERT INTO InventoryTransactions 
    (ingredientId, transactionType, quantity, costPerUnit, totalCost, orderId, recordedBy, notes) 
    VALUES ?`,
    [transactionsData],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, res);
    }
  );
};

InventoryTransaction.getByIngredient = (ingredientId, result) => {
  const query = `
    SELECT 
      it.*,
      i.ingredientName,
      s.fullName as recordedByName
    FROM InventoryTransactions it
    LEFT JOIN Ingredients i ON it.ingredientId = i.idIngredient
    LEFT JOIN Staff s ON it.recordedBy = s.idStaff
    WHERE it.ingredientId = ?
    ORDER BY it.transactionDate DESC
    LIMIT 100
  `;
  
  db.query(query, [ingredientId], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

InventoryTransaction.getByOrder = (orderId, result) => {
  const query = `
    SELECT 
      it.*,
      i.ingredientName,
      i.unit
    FROM InventoryTransactions it
    LEFT JOIN Ingredients i ON it.ingredientId = i.idIngredient
    WHERE it.orderId = ?
  `;
  
  db.query(query, [orderId], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

InventoryTransaction.getByDateRange = (startDate, endDate, result) => {
  const query = `
    SELECT 
      it.*,
      i.ingredientName,
      s.fullName as recordedByName
    FROM InventoryTransactions it
    LEFT JOIN Ingredients i ON it.ingredientId = i.idIngredient
    LEFT JOIN Staff s ON it.recordedBy = s.idStaff
    WHERE DATE(it.transactionDate) BETWEEN ? AND ?
    ORDER BY it.transactionDate DESC
  `;
  
  db.query(query, [startDate, endDate], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

InventoryTransaction.getUsageSummary = (startDate, endDate, result) => {
  const query = `
    SELECT 
      i.ingredientName,
      i.unit,
      SUM(CASE WHEN it.transactionType = 'purchase' THEN it.quantity ELSE 0 END) as totalPurchased,
      SUM(CASE WHEN it.transactionType = 'usage' THEN ABS(it.quantity) ELSE 0 END) as totalUsed,
      SUM(CASE WHEN it.transactionType = 'waste' THEN ABS(it.quantity) ELSE 0 END) as totalWasted,
      SUM(CASE WHEN it.transactionType = 'purchase' THEN it.totalCost ELSE 0 END) as totalCost
    FROM InventoryTransactions it
    LEFT JOIN Ingredients i ON it.ingredientId = i.idIngredient
    WHERE DATE(it.transactionDate) BETWEEN ? AND ?
    GROUP BY it.ingredientId, i.ingredientName, i.unit
    ORDER BY totalUsed DESC
  `;
  
  db.query(query, [startDate, endDate], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

module.exports = InventoryTransaction;

