const ExpenseCategory = require("../models/expenseCategory.model");

exports.getAll = (req, res) => {
  ExpenseCategory.getAll((err, data) => {
    if (err) {
      console.error("[GET /api/expense-categories] Error:", {
        message: err.message,
        code: err.code,
        sql: err.sql
      });
      return res.status(500).json({
        message: err.message || "Error retrieving expense categories."
      });
    }
    res.json(data);
  });
};

exports.create = (req, res) => {
  if (!req.body.name || !req.body.name.trim()) {
    return res.status(400).json({
      message: "Category name is required."
    });
  }
  if (req.body.defaultAccountId == null || req.body.defaultAccountId === "") {
    return res.status(400).json({
      message: "defaultAccountId is required (حساب المصروف الافتراضي في دليل الحسابات)."
    });
  }
  ExpenseCategory.create(
    {
      name: req.body.name.trim(),
      defaultAccountId: req.body.defaultAccountId
    },
    (err, data) => {
      if (err) {
        return res.status(500).json({
          message: err.message || "Error creating expense category."
        });
      }
      res.status(201).json(data);
    }
  );
};
