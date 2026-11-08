const db = require("./db");

/**
 * PostingSettings - GL mapping (cash, AR, sales, COGS, etc.).
 * Table: PostingSettings with name, cashAccountId, bankAccountId, arAccountId, apAccountId,
 * salesBeveragesAccountId, cogsAccountId, inventoryAccountId, etc.
 */
const PostingSettings = {};

PostingSettings.getByName = (name, result) => {
  db.query(
    "SELECT * FROM PostingSettings WHERE name = ? LIMIT 1",
    [name || "default"],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      if (!rows || rows.length === 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, rows[0]);
    }
  );
};

PostingSettings.update = (name, data, result) => {
  const fields = [];
  const values = [];
  const allowed = [
    "cashAccountId", "bankAccountId", "arAccountId", "apAccountId",
    "salesBeveragesAccountId", "salesDessertsAccountId", "cogsAccountId",
    "inventoryAccountId", "wastageAccountId", "tipsAccountId", "otherIncomeAccountId"
  ];
  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });
  if (fields.length === 0) {
    result(null, { name: name || "default" });
    return;
  }
  values.push(name || "default");
  db.query(
    `UPDATE PostingSettings SET ${fields.join(", ")} WHERE name = ?`,
    values,
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows === 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, { name: name || "default", ...data });
    }
  );
};

module.exports = PostingSettings;
