const Transfer = require("../models/transfer.model");
const { executeTransfer } = require("../services/transfer.service");

// POST /api/transfers  → Main → Barista Internal (body: ingredientId, quantity, notes?)
exports.create = (req, res) => {
  const { ingredientId, quantity, notes } = req.body;
  if (!ingredientId || quantity == null) {
    return res.status(400).json({ message: "ingredientId and quantity are required." });
  }
  const transferredBy = req.userId || null;
  executeTransfer(ingredientId, quantity, transferredBy, notes, (err, data) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Transfer failed." });
    }
    res.status(201).json({ message: "Transfer completed.", data });
  });
};

// GET /api/transfers  → list with filters: ingredientId, fromLocationId, toLocationId, startDate, endDate, limit
exports.getAll = (req, res) => {
  const filters = {
    ingredientId: req.query.ingredientId ? parseInt(req.query.ingredientId, 10) : undefined,
    fromLocationId: req.query.fromLocationId ? parseInt(req.query.fromLocationId, 10) : undefined,
    toLocationId: req.query.toLocationId ? parseInt(req.query.toLocationId, 10) : undefined,
    startDate: req.query.startDate || undefined,
    endDate: req.query.endDate || undefined,
    limit: req.query.limit || 50
  };
  Transfer.getAll(filters, (err, data) => {
    if (err) {
      return res.status(500).json({ message: err.message || "Error fetching transfers." });
    }
    res.json(data);
  });
};
