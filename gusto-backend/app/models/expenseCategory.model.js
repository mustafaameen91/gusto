const db = require("./db");

/**
 * ExpenseCategory - categories for expenses (GL).
 * Table: ExpenseCategories with idExpenseCategory, name, defaultAccountId (optional).
 */
const ExpenseCategory = {};

ExpenseCategory.getAll = (result) => {
  const query = `
    SELECT ec.*, a.name AS accountName
    FROM ExpenseCategories ec
    LEFT JOIN Accounts a ON a.idAccount = ec.defaultAccountId
    ORDER BY ec.name ASC
  `;
  db.query(query, [], (err, rows) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, rows || []);
  });
};

ExpenseCategory.create = (data, result) => {
  const payload = {
    name: data.name,
    defaultAccountId: data.defaultAccountId || null
  };
  db.query("INSERT INTO ExpenseCategories SET ?", payload, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { idExpenseCategory: res.insertId, ...payload });
  });
};

module.exports = ExpenseCategory;
