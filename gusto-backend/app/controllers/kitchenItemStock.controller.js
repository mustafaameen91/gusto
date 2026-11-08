const KitchenItemStock = require("../models/kitchenItemStock.model");

// GET /api/kitchen-stock/menu  → kitchen menu (only items with quantity > 0). Query: includeZero=1 for admin to see all
exports.getMenu = (req, res) => {
  const includeZero = req.query.includeZero === "1" || req.query.includeZero === "true";
  KitchenItemStock.getMenu(includeZero, (err, data) => {
    if (err) {
      return res.status(500).json({ message: err.message || "Error fetching kitchen menu." });
    }
    res.json(data);
  });
};

// POST /api/kitchen-stock/add  → add quantity to a menu item (body: menuItemId, quantity)
exports.add = (req, res) => {
  const { menuItemId, quantity } = req.body;
  if (!menuItemId || quantity == null) {
    return res.status(400).json({ message: "menuItemId and quantity are required." });
  }
  KitchenItemStock.add(menuItemId, quantity, (err, data) => {
    if (err) {
      return res.status(500).json({ message: err.message || "Error adding to kitchen stock." });
    }
    res.json({ message: "Added to kitchen stock.", data });
  });
};

// PATCH /api/kitchen-stock/decrease  → decrease quantity (e.g. after sell). Body: menuItemId, quantity
exports.decrease = (req, res) => {
  const { menuItemId, quantity } = req.body;
  if (!menuItemId || quantity == null) {
    return res.status(400).json({ message: "menuItemId and quantity are required." });
  }
  KitchenItemStock.decrease(menuItemId, quantity, (err, data) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Cannot decrease kitchen stock." });
    }
    res.json({ message: "Decreased.", data });
  });
};

// PUT /api/kitchen-stock/set  → set absolute quantity (body: menuItemId, quantity)
exports.setQuantity = (req, res) => {
  const { menuItemId, quantity } = req.body;
  if (!menuItemId || quantity == null) {
    return res.status(400).json({ message: "menuItemId and quantity are required." });
  }
  KitchenItemStock.setQuantity(menuItemId, quantity, (err, data) => {
    if (err) {
      return res.status(500).json({ message: err.message || "Error setting kitchen stock." });
    }
    res.json({ message: "Quantity set.", data });
  });
};
