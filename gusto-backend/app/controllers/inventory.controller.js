const Ingredient = require("../models/ingredient.model");
const InventoryTransaction = require("../models/inventoryTransaction.model");

exports.create = (req, res) => {
  if (!req.body.ingredientName || !req.body.unit) {
    return res.status(400).json({
      message: "Ingredient name and unit are required!"
    });
  }

  const ingredient = {
    ingredientName: req.body.ingredientName,
    unit: req.body.unit,
    currentStock: req.body.currentStock || 0,
    minStock: req.body.minStock || 0,
    maxStock: req.body.maxStock || 0,
    costPerUnit: req.body.costPerUnit || 0,
    notes: req.body.notes || null,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true
  };

  Ingredient.create(ingredient, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating ingredient."
      });
    }
    res.json(data);
  });
};

exports.findAll = (req, res) => {
  Ingredient.getAll((err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving ingredients."
      });
    }
    res.json(data);
  });
};

exports.findOne = (req, res) => {
  Ingredient.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Ingredient not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error retrieving ingredient with id " + req.params.id
      });
    }
    res.json(data);
  });
};

exports.getLowStock = (req, res) => {
  Ingredient.getLowStock((err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving low stock items."
      });
    }
    res.json(data);
  });
};

exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      message: "Content cannot be empty!"
    });
  }

  Ingredient.updateById(req.params.id, req.body, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Ingredient not found with id ${req.params.id}.`
        });
      }
      // Log the actual error for debugging
      console.error('Error updating ingredient:', err);
      return res.status(500).json({
        message: err.message || "Error updating ingredient with id " + req.params.id,
        error: process.env.NODE_ENV === 'development' ? err : undefined
      });
    }
    res.json(data);
  });
};

// Manual stock change on the main store, in one locked transaction:
//   usage / waste → always take out; adjustment → signed (+ adds, − removes)
// Stock can't go below zero. Cost defaults to the ingredient's average cost, and the
// movement is tied to the open shift so its waste/usage is posted when the shift closes.
exports.adjustStock = (req, res) => {
  const TYPES = ["usage", "waste", "adjustment"];
  const type = req.body.transactionType;
  const raw = Number(req.body.quantity);
  if (!TYPES.includes(type)) return res.status(400).json({ message: "نوع العملية غير صحيح" });
  if (!Number.isFinite(raw) || raw === 0) return res.status(400).json({ message: "الكمية يجب أن تكون رقماً غير الصفر" });
  const quantity = type === "adjustment" ? raw : -Math.abs(raw);
  const db = require("../models/db");

  db.getConnection((errConn, conn) => {
    if (errConn) return res.status(500).json({ message: errConn.message });
    const fail = (status, message) => conn.rollback(() => { conn.release(); res.status(status).json({ message }); });
    conn.beginTransaction((errTx) => {
      if (errTx) { conn.release(); return res.status(500).json({ message: errTx.message }); }
      conn.query("SELECT idIngredient, currentStock, costPerUnit FROM Ingredients WHERE idIngredient = ? FOR UPDATE", [req.params.id], (e1, rows) => {
        if (e1) return fail(500, e1.message);
        if (!rows.length) return fail(404, `Ingredient not found with id ${req.params.id}.`);
        const ing = rows[0];
        const after = Number(ing.currentStock) + quantity;
        if (after < -0.0005) return fail(400, `المخزون غير كافٍ: المتوفر ${Number(ing.currentStock)}`);
        const unitCost = Number(req.body.costPerUnit) > 0 ? Number(req.body.costPerUnit) : Number(ing.costPerUnit) || 0;
        const totalCost = Math.round((type === "adjustment" ? quantity : Math.abs(quantity)) * unitCost * 100) / 100;
        conn.query("UPDATE Ingredients SET currentStock = currentStock + ? WHERE idIngredient = ?", [quantity, ing.idIngredient], (e2) => {
          if (e2) return fail(500, e2.message);
          conn.query(
            `INSERT INTO InventoryTransactions (ingredientId, transactionType, quantity, costPerUnit, totalCost, orderId, dailyReceiptId, recordedBy, notes)
             VALUES (?, ?, ?, ?, ?, NULL, (SELECT idDailyReceipt FROM DailyReceipts WHERE isClosed = 0 ORDER BY idDailyReceipt DESC LIMIT 1), ?, ?)`,
            [ing.idIngredient, type, quantity, unitCost, totalCost, req.userId, req.body.notes || null],
            (e3) => {
              if (e3) return fail(500, e3.message);
              conn.commit((e4) => {
                if (e4) return fail(500, e4.message);
                conn.release();
                res.json({ message: "Stock adjusted successfully", currentStock: after, totalCost });
              });
            }
          );
        });
      });
    });
  });
};

exports.getTransactions = (req, res) => {
  InventoryTransaction.getByIngredient(req.params.id, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving transactions."
      });
    }
    res.json(data);
  });
};

exports.delete = (req, res) => {
  Ingredient.remove(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Ingredient not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Could not delete ingredient with id " + req.params.id
      });
    }
    res.json({ message: "Ingredient deleted successfully!" });
  });
};

// Get inventory usage summary for reports
exports.getUsageSummary = (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  if (!startDate || !endDate) {
    return res.status(400).json({
      message: "Start date and end date are required!"
    });
  }

  InventoryTransaction.getUsageSummary(startDate, endDate, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving inventory usage summary."
      });
    }
    res.json(data);
  });
};

