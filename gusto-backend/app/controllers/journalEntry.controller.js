const JournalEntry = require("../models/journalEntry.model");

exports.getAll = (req, res) => {
  const limit = req.query.limit || 50;
  JournalEntry.getAll(limit, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving journal entries."
      });
    }
    res.json(data);
  });
};
