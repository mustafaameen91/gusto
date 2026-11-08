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
  const recipes = req.body.recipes || [];

  console.log('📝 Backend: Received bulkUpdate request');
  console.log('  menuItemId:', menuItemId);
  console.log('  recipes array length:', recipes.length);
  console.log('  Full recipes data:', JSON.stringify(recipes, null, 2));

  // Validate recipes array
  for (let recipe of recipes) {
    if (!recipe.ingredientId || !recipe.quantityNeeded) {
      console.error('❌ Validation failed for recipe:', recipe);
      return res.status(400).json({
        message: "Each recipe must have ingredientId and quantityNeeded!"
      });
    }
    console.log(`  ✓ Recipe valid: ingredientId=${recipe.ingredientId}, sizeId=${recipe.sizeId}, qty=${recipe.quantityNeeded}`);
  }

  Recipe.bulkCreate(menuItemId, recipes, (err, data) => {
    if (err) {
      console.error('❌ Error in bulkCreate:', err);
      return res.status(500).json({
        message: err.message || "Error updating recipes."
      });
    }
    console.log('✅ Recipes saved successfully! Rows affected:', data.affectedRows);
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

