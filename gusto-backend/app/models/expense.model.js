const db = require("./db");

const Expense = function(expense) {
  this.expenseDate = expense.expenseDate;
  this.category = expense.category;
  this.amount = expense.amount;
  this.description = expense.description;
  this.receiptNumber = expense.receiptNumber;
  this.photoUrl = expense.photoUrl;
  this.recordedBy = expense.recordedBy;
  this.dailyReceiptId = expense.dailyReceiptId;
  this.expenseCategoryId = expense.expenseCategoryId ?? null;
  this.paidFromAccountId = expense.paidFromAccountId ?? null;
  this.supplierId = expense.supplierId ?? null;
};

// Create new expense
Expense.create = (newExpense, result) => {
  db.query("INSERT INTO Expenses SET ?", newExpense, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...newExpense });
  });
};

// Get all expenses with filters
Expense.getAll = (filters, result) => {
  let query = `
    SELECT
      e.*,
      s.fullName as recordedByName,
      dr.receiptDate as dailyReceiptDate,
      a.name as paidFromAccountName,
      a.code as paidFromAccountCode,
      sup.supplierName as supplierName
    FROM Expenses e
    LEFT JOIN Staff s ON e.recordedBy = s.idStaff
    LEFT JOIN DailyReceipts dr ON e.dailyReceiptId = dr.idDailyReceipt
    LEFT JOIN Accounts a ON e.paidFromAccountId = a.idAccount
    LEFT JOIN Suppliers sup ON e.supplierId = sup.idSupplier
    WHERE 1=1
  `;
  
  const params = [];
  
  if (filters.startDate) {
    query += ` AND e.expenseDate >= ?`;
    params.push(filters.startDate);
  }
  
  if (filters.endDate) {
    query += ` AND e.expenseDate <= ?`;
    params.push(filters.endDate);
  }
  
  if (filters.category) {
    query += ` AND e.category = ?`;
    params.push(filters.category);
  }
  
  if (filters.dailyReceiptId) {
    query += ` AND e.dailyReceiptId = ?`;
    params.push(filters.dailyReceiptId);
  }

  if (filters.supplierId) {
    query += ` AND e.supplierId = ?`;
    params.push(filters.supplierId);
  }
  
  query += ` ORDER BY e.expenseDate DESC, e.createdAt DESC`;
  
  if (filters.limit) {
    query += ` LIMIT ?`;
    params.push(parseInt(filters.limit));
  }
  
  db.query(query, params, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

// Get expense by ID
Expense.findById = (id, result) => {
  const query = `
    SELECT 
      e.*,
      DATE_FORMAT(e.expenseDate, '%Y-%m-%d') as expenseDate,
      s.fullName as recordedByName,
      dr.receiptDate as dailyReceiptDate
    FROM Expenses e
    LEFT JOIN Staff s ON e.recordedBy = s.idStaff
    LEFT JOIN DailyReceipts dr ON e.dailyReceiptId = dr.idDailyReceipt
    WHERE e.idExpense = ?
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

// Update expense
Expense.updateById = (id, expense, result) => {
  db.query(
    "UPDATE Expenses SET ? WHERE idExpense = ?",
    [expense, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, { id: id, ...expense });
    }
  );
};

// Delete expense
Expense.remove = (id, result) => {
  db.query("DELETE FROM Expenses WHERE idExpense = ?", [id], (err, res) => {
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

// Get expense summary by date range
Expense.getSummary = (startDate, endDate, result) => {
  const query = `
    SELECT 
      category,
      COUNT(*) as count,
      SUM(amount) as totalAmount
    FROM Expenses
    WHERE expenseDate >= ? AND expenseDate <= ?
    GROUP BY category
    ORDER BY totalAmount DESC
  `;
  
  db.query(query, [startDate, endDate], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

// Get total expenses for a date range
Expense.getTotal = (startDate, endDate, result) => {
  const query = `
    SELECT 
      COALESCE(SUM(amount), 0) as totalExpenses,
      COUNT(*) as expenseCount
    FROM Expenses
    WHERE expenseDate >= ? AND expenseDate <= ?
  `;
  
  db.query(query, [startDate, endDate], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res[0]);
  });
};

// Get expenses by category
Expense.getByCategory = (category, startDate, endDate, result) => {
  const query = `
    SELECT 
      e.*,
      s.fullName as recordedByName
    FROM Expenses e
    LEFT JOIN Staff s ON e.recordedBy = s.idStaff
    WHERE e.category = ? 
      AND e.expenseDate >= ? 
      AND e.expenseDate <= ?
    ORDER BY e.expenseDate DESC
  `;
  
  db.query(query, [category, startDate, endDate], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

// Total expenses for a shift (by dailyReceiptId)
Expense.getTotalByShift = (dailyReceiptId, result) => {
  db.query(
    "SELECT COALESCE(SUM(amount), 0) AS totalExpenses, COUNT(*) AS expenseCount FROM Expenses WHERE dailyReceiptId = ?",
    [dailyReceiptId],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, res[0]);
    }
  );
};

// Total paid to a supplier (expenses with this supplierId = payments to supplier)
Expense.getTotalBySupplier = (supplierId, result) => {
  db.query(
    "SELECT COALESCE(SUM(amount), 0) AS totalAmount, COUNT(*) AS expenseCount FROM Expenses WHERE supplierId = ?",
    [supplierId],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, res[0]);
    }
  );
};

module.exports = Expense;

