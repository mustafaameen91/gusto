const Tip = require("../models/tip.model");
const { todayBusinessDate, businessWindow } = require("../services/businessDay");

// Create new tip
exports.create = (req, res) => {
  if (!req.body.tipDate || !req.body.amount) {
    return res.status(400).json({
      message: "Tip date and amount are required!"
    });
  }
  if (!(Number(req.body.amount) > 0)) {
    return res.status(400).json({ message: "المبلغ يجب أن يكون رقماً أكبر من صفر" });
  }

  const tip = new Tip({
    tipDate: req.body.tipDate,
    amount: parseFloat(req.body.amount),
    orderId: req.body.orderId || null,
    recordedBy: req.userId
  });

  // Tips are taken in the open shift: they count in its drawer and are posted when it closes
  require("../models/db").query(
    "SELECT idDailyReceipt FROM DailyReceipts WHERE isClosed = 0 ORDER BY idDailyReceipt DESC LIMIT 1",
    (errS, rows) => {
      tip.dailyReceiptId = !errS && rows[0] ? rows[0].idDailyReceipt : null;
      createTip();
    }
  );
  const createTip = () => Tip.create(tip, (err, data) => {
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
  if (req.body.amount !== undefined) {
    if (!(Number(req.body.amount) > 0)) return res.status(400).json({ message: "المبلغ يجب أن يكون رقماً أكبر من صفر" });
    tip.amount = parseFloat(req.body.amount);
  }
  if (req.body.orderId !== undefined) tip.orderId = req.body.orderId;
  if (!Object.keys(tip).length) return res.status(400).json({ message: "Data to update can not be empty!" });

  // A tip in a closed (posted) shift can't change any more
  require("../models/db").query(
    "SELECT dr.isClosed FROM Tips t LEFT JOIN DailyReceipts dr ON dr.idDailyReceipt = t.dailyReceiptId WHERE t.idTip = ?",
    [req.params.id],
    (errC, rows) => {
      if (!errC && rows[0] && rows[0].isClosed) return res.status(400).json({ message: "لا يمكن تعديل إكرامية في شفت مغلق" });
      updateTip();
    }
  );
  const updateTip = () => Tip.updateById(req.params.id, tip, (err, data) => {
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
  const startDate = req.query.startDate || todayBusinessDate();
  const endDate = req.query.endDate || todayBusinessDate();

  Tip.getSummary(startDate, endDate, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving tip summary."
      });
    }
    res.json(data);
  });
};

