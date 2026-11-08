const Category = require("../models/category.model");

exports.create = (req, res) => {
  if (!req.body.categoryName) {
    return res.status(400).json({
      message: "Category name is required!"
    });
  }

  const category = {
    categoryName: req.body.categoryName,
    description: req.body.description || null,
    displayOrder: req.body.displayOrder || 0,
    imageUrl: req.body.imageUrl || null,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    isKitchen: req.body.isKitchen !== undefined ? req.body.isKitchen : true
  };

  Category.create(category, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating category."
      });
    }
    res.json(data);
  });
};

exports.findAll = (req, res) => {
  Category.getAll((err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving categories."
      });
    }
    res.json(data);
  });
};

exports.findOne = (req, res) => {
  Category.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Category not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error retrieving category with id " + req.params.id
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

  Category.updateById(req.params.id, req.body, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Category not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error updating category with id " + req.params.id
      });
    }
    res.json(data);
  });
};

exports.delete = (req, res) => {
  Category.remove(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Category not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Could not delete category with id " + req.params.id
      });
    }
    res.json({ message: "Category deleted successfully!" });
  });
};

