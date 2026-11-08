const ItemSize = require("../models/itemSize.model");

// Get all sizes for a menu item
exports.getByMenuItem = (req, res) => {
  ItemSize.getByMenuItem(req.params.menuItemId, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving item sizes."
      });
    }
    res.json(data);
  });
};

// Create new size
exports.create = (req, res) => {
  if (!req.body.menuItemId || !req.body.sizeName) {
    return res.status(400).json({
      message: "Menu item ID and size name are required!"
    });
  }

  const itemSize = {
    menuItemId: req.body.menuItemId,
    sizeName: req.body.sizeName,
    priceAdjustment: req.body.priceAdjustment || 0,
    isDefault: req.body.isDefault || false,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true
  };

  ItemSize.create(itemSize, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating item size."
      });
    }
    res.json(data);
  });
};

// Update size
exports.update = (req, res) => {
  const itemSize = {
    sizeName: req.body.sizeName,
    priceAdjustment: req.body.priceAdjustment,
    isDefault: req.body.isDefault,
    isActive: req.body.isActive
  };

  ItemSize.update(req.params.id, itemSize, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Item size not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error updating item size."
      });
    }
    res.json(data);
  });
};

// Delete size
exports.delete = (req, res) => {
  ItemSize.delete(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Item size not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error deleting item size."
      });
    }
    res.json({ message: "Item size deleted successfully!" });
  });
};

