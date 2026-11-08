const PostingSettings = require("../models/postingSettings.model");

exports.getByName = (req, res) => {
  const name = req.query.name || req.params.name || "default";
  PostingSettings.getByName(name, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({ message: "Posting settings not found." });
      }
      return res.status(500).json({
        message: err.message || "Error retrieving posting settings."
      });
    }
    res.json(data);
  });
};

exports.update = (req, res) => {
  const name = req.body.name || req.params.name || "default";
  PostingSettings.update(name, req.body, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({ message: "Posting settings not found." });
      }
      return res.status(500).json({
        message: err.message || "Error updating posting settings."
      });
    }
    res.json(data);
  });
};
