const MenuItem = require("../models/menuItem.model");
const path = require('path');
const fs = require('fs');
const Recipe = require("../models/recipe.model");

exports.create = (req, res) => {
  if (!req.body.itemName || !req.body.categoryId) {
    return res.status(400).json({
      message: "Item name and category are required!"
    });
  }

  const menuItem = {
    categoryId: req.body.categoryId,
    itemName: req.body.itemName,
    description: req.body.description || null,
    basePrice: req.body.basePrice || 0,
    imageUrl: req.body.imageUrl || null,
    preparationTime: req.body.preparationTime || 0,
    itemType: req.body.itemType || 'recipe',
    isInventoryItem: req.body.isInventoryItem || false,
    isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true
  };

  MenuItem.create(menuItem, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating menu item."
      });
    }

    // If recipes provided, create them
    if (req.body.recipes && req.body.recipes.length > 0) {
      Recipe.bulkCreate(data.id, req.body.recipes, (err) => {
        if (err) {
          console.error("Error creating recipes:", err);
        }
      });
    }

    res.json(data);
  });
};

exports.findAll = (req, res) => {
  MenuItem.getAll((err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving menu items."
      });
    }
    res.json(data);
  });
};

exports.findOne = (req, res) => {
  MenuItem.getWithRecipes(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Menu item not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error retrieving menu item with id " + req.params.id
      });
    }
    res.json(data);
  });
};

exports.findByCategory = (req, res) => {
  MenuItem.getByCategory(req.params.categoryId, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving menu items."
      });
    }
    res.json(data);
  });
};

exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      message: "Content cannot be empty!"
    });
  }

  MenuItem.updateById(req.params.id, req.body, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Menu item not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error updating menu item with id " + req.params.id
      });
    }

    // Update recipes if provided
    if (req.body.recipes !== undefined) {
      Recipe.bulkCreate(req.params.id, req.body.recipes, (err) => {
        if (err) {
          console.error("Error updating recipes:", err);
        }
      });
    }

    res.json(data);
  });
};

exports.toggleAvailability = (req, res) => {
  MenuItem.toggleAvailability(req.params.id, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: "Error toggling availability"
      });
    }
    res.json({ message: "Availability toggled successfully" });
  });
};

exports.delete = (req, res) => {
  MenuItem.remove(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Menu item not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Could not delete menu item with id " + req.params.id
      });
    }
    res.json({ message: "Menu item deleted successfully!" });
  });
};

exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image file provided!"
    });
  }

  // Return the relative URL path
  const imageUrl = `/uploads/${req.file.filename}`;
  
  res.json({
    message: "Image uploaded successfully",
    imageUrl: imageUrl,
    filename: req.file.filename
  });
};

