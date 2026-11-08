const StorageLocation = require("../models/storageLocation.model");

exports.getAll = (req, res) => {
  StorageLocation.getAll((err, data) => {
    if (err) {
      return res.status(500).json({ message: err.message || "Error fetching storage locations." });
    }
    res.json(data);
  });
};

exports.findById = (req, res) => {
  StorageLocation.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({ message: "Storage location not found." });
      }
      return res.status(500).json({ message: err.message || "Error fetching storage location." });
    }
    res.json(data);
  });
};
