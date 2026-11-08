const db = require("./db");

/**
 * Account model - chart of accounts (GL).
 * Table columns: idAccount, code, name, accountType, parentId, isActive, createdAt, updatedAt
 */
const Account = {};

Account.getAll = (result) => {
  const query = `
    SELECT * FROM Accounts
    ORDER BY code ASC
  `;
  db.query(query, [], (err, rows) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, rows || []);
  });
};

/**
 * Get accounts by type (e.g. REVENUE for إيرادات — used for outer income dropdown).
 * Column may be accountType or account_type depending on DB.
 */
Account.getAllByType = (accountType, result) => {
  if (!accountType) {
    return Account.getAll(result);
  }
  db.query(
    `SELECT * FROM Accounts WHERE accountType = ? AND isActive = 1 ORDER BY code ASC`,
    [accountType],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, rows || []);
    }
  );
};

Account.findById = (id, result) => {
  db.query("SELECT * FROM Accounts WHERE idAccount = ?", [id], (err, rows) => {
    if (err) {
      result(err, null);
      return;
    }
    if (!rows || rows.length === 0) {
      result({ kind: "not_found" }, null);
      return;
    }
    result(null, rows[0]);
  });
};

Account.create = (account, result) => {
  db.query("INSERT INTO Accounts SET ?", account, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { idAccount: res.insertId, ...account });
  });
};

Account.update = (id, account, result) => {
  db.query("UPDATE Accounts SET ? WHERE idAccount = ?", [account, id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.affectedRows === 0) {
      result({ kind: "not_found" }, null);
      return;
    }
    result(null, { idAccount: id, ...account });
  });
};

Account.delete = (id, result) => {
  db.query("DELETE FROM Accounts WHERE idAccount = ?", [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.affectedRows === 0) {
      result({ kind: "not_found" }, null);
      return;
    }
    result(null, res);
  });
};

module.exports = Account;
