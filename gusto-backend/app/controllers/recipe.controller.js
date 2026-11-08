const Recipe = require("../models/recipe.model");

// Create a single recipe
exports.create = (req, res) => {
  if (!req.body.menuItemId || !req.body.ingredientId || !req.body.quantityNeeded) {
    return res.status(400).json({
      message: "Menu item, ingredient, and quantity are required!"
    });
  }

  const recipe = {
    menuItemId: req.body.menuItemId,
    sizeId: req.body.sizeId || null,
    ingredientId: req.body.ingredientId,
    quantityNeeded: req.body.quantityNeeded,
    notes: req.body.notes || null
  };

  Recipe.create(recipe, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating recipe."
      });
    }
    res.json(data);
  });
};

// Bulk create/update recipes for a menu item
exports.bulkUpdate = (req, res) => {
  const menuItemId = req.params.menuItemId;
  const recipes = req.body.recipes;

  // The body is the item's COMPLETE recipe set (base lines with sizeId null + per-size
  // lines); everything not sent is removed.
  if (!Array.isArray(recipes)) {
    return res.status(400).json({ message: "يجب إرسال قائمة الوصفات كاملة (recipes)." });
  }

  for (const recipe of recipes) {
    const qty = Number(recipe.quantityNeeded);
    if (!recipe.ingredientId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({
        message: "كل سطر في الوصفة يحتاج مكوّناً وكمية أكبر من صفر."
      });
    }
  }

  Recipe.bulkCreate(menuItemId, recipes, (err, data) => {
    if (err) {
      console.error('❌ Error in bulkCreate:', err);
      return res.status(500).json({
        message: err.message || "Error updating recipes."
      });
    }
    res.json({
      message: "Recipes updated successfully!",
      data: data
    });
  });
};

// Get all recipes for a menu item
exports.getByMenuItem = (req, res) => {
  Recipe.getByMenuItem(req.params.menuItemId, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving recipes."
      });
    }
    res.json(data);
  });
};

// Delete a single recipe
exports.delete = (req, res) => {
  Recipe.remove(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Recipe not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Could not delete recipe with id " + req.params.id
      });
    }
    res.json({ message: "Recipe deleted successfully!" });
  });
};

// Delete all recipes for a menu item
exports.deleteByMenuItem = (req, res) => {
  Recipe.removeByMenuItem(req.params.menuItemId, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error deleting recipes."
      });
    }
    res.json({ message: "All recipes deleted successfully!" });
  });
};

