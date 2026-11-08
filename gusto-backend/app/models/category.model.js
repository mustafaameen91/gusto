const db = require("./db");

const Category = function(category) {
  this.categoryName = category.categoryName;
  this.description = category.description;
  this.displayOrder = category.displayOrder;
  this.imageUrl = category.imageUrl;
  this.isActive = category.isActive;
  this.isKitchen = category.isKitchen !== undefined ? category.isKitchen : true;
};

Category.create = (newCategory, result) => {
  db.query("INSERT INTO Categories SET ?", newCategory, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...newCategory });
  });
};

Category.findById = (id, result) => {
  db.query("SELECT * FROM Categories WHERE idCategory = ?", [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.length) {
      result(null, res[0]);
      return;
    }
    result({ kind: "not_found" }, null);
  });
};

Category.getAll = (result) => {
  db.query("SELECT * FROM Categories WHERE isActive = TRUE ORDER BY displayOrder", (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Category.updateById = (id, category, result) => {
  db.query(
    "UPDATE Categories SET categoryName = ?, description = ?, displayOrder = ?, imageUrl = ?, isActive = ?, isKitchen = ? WHERE idCategory = ?",
    [category.categoryName, category.description, category.displayOrder, category.imageUrl, category.isActive, category.isKitchen !== undefined ? category.isKitchen : true, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, { id: id, ...category });
    }
  );
};

Category.remove = (id, result) => {
  db.query("DELETE FROM Categories WHERE idCategory = ?", [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.affectedRows == 0) {
      result({ kind: "not_found" }, null);
      return;
    }
    result(null, res);
  });
};

module.exports = Category;

