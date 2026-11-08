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

exports.adjustStock = (req, res) => {
  if (!req.body.quantity || !req.body.transactionType) {
    return res.status(400).json({
      message: "Quantity and transaction type are required!"
    });
  }

  // Update stock
  Ingredient.updateStock(req.params.id, req.body.quantity, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Ingredient not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error updating stock for ingredient " + req.params.id
      });
    }

    // Record transaction
    const transaction = {
      ingredientId: req.params.id,
      transactionType: req.body.transactionType,
      quantity: req.body.quantity,
      costPerUnit: req.body.costPerUnit || null,
      totalCost: req.body.totalCost || null,
      recordedBy: req.userId,
      notes: req.body.notes || null
    };

    InventoryTransaction.create(transaction, (err) => {
      if (err) {
        console.error("Error creating inventory transaction:", err);
      }
    });

    res.json({ message: "Stock adjusted successfully" });
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

