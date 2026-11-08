const Account = require("../models/account.model");

// Map DB columns (code, name) to API (accountCode, accountName) for frontend
function toApi(row) {
  if (!row) return row;
  return {
    idAccount: row.idAccount,
    accountCode: row.code,
    accountName: row.name,
    accountType: row.accountType,
    parentId: row.parentId,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

exports.getAll = (req, res) => {
  const type = req.query.type ? String(req.query.type).trim() : null;
  const method = type ? (cb) => Account.getAllByType(type, cb) : Account.getAll;
  method((err, data) => {
    if (err) {
      console.error("[GET /api/accounts] Error:", {
        message: err.message,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sql: err.sql
      });
      const msg = err.message || "Error retrieving accounts.";
      const hint = (err.code === "ER_NO_SUCH_TABLE" || /doesn't exist/i.test(msg))
        ? " Run migration: gusto-backend/database/schema.sql"
        : "";
      return res.status(500).json({
        message: msg + hint
      });
    }
    const list = Array.isArray(data) ? data.map(toApi) : [];
    res.json(list);
  });
};

exports.findById = (req, res) => {
  Account.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({ message: "Account not found." });
      }
      return res.status(500).json({
        message: err.message || "Error retrieving account."
      });
    }
    res.json(toApi(data));
  });
};

exports.create = (req, res) => {
  if (!req.body.accountCode || !req.body.accountName) {
    return res.status(400).json({
      message: "accountCode and accountName are required."
    });
  }
  const account = {
    code: req.body.accountCode,
    name: req.body.accountName,
    accountType: req.body.accountType || null,
    parentId: req.body.parentId ?? null,
    isActive: req.body.isActive !== undefined ? req.body.isActive : 1
  };
  Account.create(account, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating account."
      });
    }
    res.status(201).json(toApi(data));
  });
};

exports.update = (req, res) => {
  const account = {};
  if (req.body.accountCode !== undefined) account.code = req.body.accountCode;
  if (req.body.accountName !== undefined) account.name = req.body.accountName;
  if (req.body.accountType !== undefined) account.accountType = req.body.accountType;
  if (req.body.parentId !== undefined) account.parentId = req.body.parentId;
  if (req.body.isActive !== undefined) account.isActive = req.body.isActive;
  if (Object.keys(account).length === 0) {
    return res.status(400).json({ message: "No fields to update." });
  }
  Account.update(req.params.id, account, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({ message: "Account not found." });
      }
      return res.status(500).json({
        message: err.message || "Error updating account."
      });
    }
    res.json(toApi(data));
  });
};

exports.delete = (req, res) => {
  Account.delete(req.params.id, (err) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({ message: "Account not found." });
      }
      return res.status(500).json({
        message: err.message || "Error deleting account."
      });
    }
    res.json({ message: "Account deleted." });
  });
};
