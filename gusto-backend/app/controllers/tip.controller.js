const Tip = require("../models/tip.model");

// Create new tip
exports.create = (req, res) => {
  if (!req.body.tipDate || !req.body.amount) {
    return res.status(400).json({
      message: "Tip date and amount are required!"
    });
  }

  const tip = new Tip({
    tipDate: req.body.tipDate,
    amount: parseFloat(req.body.amount),
    orderId: req.body.orderId || null,
    recordedBy: req.userId
  });

  Tip.create(tip, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating tip."
      });
    }
    res.status(201).json(data);
  });
};

// Get all tips with filters
exports.getAll = (req, res) => {
  const filters = {
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null,
    orderId: req.query.orderId || null,
    limit: req.query.limit || null
  };

  Tip.getAll(filters, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving tips."
      });
    }
    res.json(data);
  });
};

// Get tip by ID
exports.findById = (req, res) => {
  Tip.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Tip with id ${req.params.id} not found.`
        });
      }
      return res.status(500).json({
        message: err.message || "Error retrieving tip."
      });
    }
    res.json(data);
  });
};

// Update tip
exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      message: "Data to update can not be empty!"
    });
  }

  const tip = {};
  if (req.body.tipDate) tip.tipDate = req.body.tipDate;
  if (req.body.amount !== undefined) tip.amount = parseFloat(req.body.amount);
  if (req.body.orderId !== undefined) tip.orderId = req.body.orderId;

  Tip.updateById(req.params.id, tip, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Tip with id ${req.params.id} not found.`
        });
      }
      return res.status(500).json({
        message: err.message || "Error updating tip."
      });
    }
    res.json(data);
  });
};

// Delete tip
exports.delete = (req, res) => {
  Tip.remove(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Tip with id ${req.params.id} not found.`
        });
      }
      return res.status(500).json({
        message: err.message || "Error deleting tip."
      });
    }
    res.json({ message: "Tip deleted successfully." });
  });
};

// Get tip summary
exports.getSummary = (req, res) => {
  const startDate = req.query.startDate || new Date().toISOString().split('T')[0];
  const endDate = req.query.endDate || new Date().toISOString().split('T')[0];

  Tip.getSummary(startDate, endDate, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving tip summary."
      });
    }
    res.json(data);
  });
};

