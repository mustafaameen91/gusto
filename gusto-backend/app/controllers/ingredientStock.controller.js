const IngredientStock = require("../models/ingredientStock.model");
const Ingredient = require("../models/ingredient.model");

// GET /api/ingredient-stock/location/:locationId  → list stock for a location (e.g. Barista Internal)
exports.getByLocation = (req, res) => {
  const locationId = parseInt(req.params.locationId, 10);
  if (!locationId) {
    return res.status(400).json({ message: "Invalid locationId." });
  }
  IngredientStock.getByLocation(locationId, (err, data) => {
    if (err) {
      return res.status(500).json({ message: err.message || "Error fetching stock by location." });
    }
    res.json(data);
  });
};

// GET /api/ingredient-stock/ingredient/:ingredientId  → stock per location for one ingredient
exports.getByIngredient = (req, res) => {
  const ingredientId = parseInt(req.params.ingredientId, 10);
  if (!ingredientId) {
    return res.status(400).json({ message: "Invalid ingredientId." });
  }
  IngredientStock.getByIngredient(ingredientId, (err, data) => {
    if (err) {
      return res.status(500).json({ message: err.message || "Error fetching stock by ingredient." });
    }
    res.json(data);
  });
};

// GET /api/ingredient-stock/main  → Main stock comes from Ingredients.currentStock (for compatibility)
exports.getMainStock = (req, res) => {
  Ingredient.getAll((err, ingredients) => {
    if (err) {
      return res.status(500).json({ message: err.message || "Error fetching main stock." });
    }
    const list = (ingredients || []).map((i) => ({
      ingredientId: i.idIngredient,
      ingredientName: i.ingredientName,
      unit: i.unit,
      quantity: parseFloat(i.currentStock || 0),
      locationId: 1,
      locationCode: "main"
    }));
    res.json(list);
  });
};
