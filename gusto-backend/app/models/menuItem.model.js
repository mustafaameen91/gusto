const db = require("./db");

const MenuItem = function(item) {
  this.categoryId = item.categoryId;
  this.itemName = item.itemName;
  this.description = item.description;
  this.basePrice = item.basePrice;
  this.imageUrl = item.imageUrl;
  this.preparationTime = item.preparationTime;
  this.itemType = item.itemType;
  this.isInventoryItem = item.isInventoryItem;
  this.isAvailable = item.isAvailable;
  this.isActive = item.isActive;
};

MenuItem.create = (newItem, result) => {
  db.query("INSERT INTO MenuItems SET ?", newItem, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...newItem });
  });
};

MenuItem.findById = (id, result) => {
  const query = `
    SELECT m.*, c.categoryName 
    FROM MenuItems m
    LEFT JOIN Categories c ON m.categoryId = c.idCategory
    WHERE m.idMenuItem = ?
  `;
  
  db.query(query, [id], (err, res) => {
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

MenuItem.getAll = (result) => {
  const query = `
    SELECT m.*, c.categoryName 
    FROM MenuItems m
    LEFT JOIN Categories c ON m.categoryId = c.idCategory
    WHERE m.isActive = TRUE
    ORDER BY c.displayOrder, m.itemName
  `;
  
  db.query(query, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

MenuItem.getByCategory = (categoryId, result) => {
  const query = `
    SELECT * FROM MenuItems 
    WHERE categoryId = ? AND isActive = TRUE
    ORDER BY itemName
  `;
  
  db.query(query, [categoryId], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

MenuItem.getWithRecipes = (id, result) => {
  const query = `
    SELECT 
      m.*,
      c.categoryName,
      c.isKitchen AS categoryIsKitchen,
      r.idRecipe,
      r.sizeId,
      r.quantityNeeded,
      i.idIngredient,
      i.ingredientName,
      i.unit
    FROM MenuItems m
    LEFT JOIN Categories c ON m.categoryId = c.idCategory
    LEFT JOIN Recipes r ON m.idMenuItem = r.menuItemId
    LEFT JOIN Ingredients i ON r.ingredientId = i.idIngredient
    WHERE m.idMenuItem = ?
  `;
  
  db.query(query, [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.length) {
      // Group recipes
      const item = {
        idMenuItem: res[0].idMenuItem,
        categoryId: res[0].categoryId,
        categoryName: res[0].categoryName,
        isKitchen: res[0].categoryIsKitchen === 1 || res[0].categoryIsKitchen === true,
        itemName: res[0].itemName,
        description: res[0].description,
        basePrice: res[0].basePrice,
        imageUrl: res[0].imageUrl,
        preparationTime: res[0].preparationTime,
        itemType: res[0].itemType,
        isInventoryItem: res[0].isInventoryItem,
        isAvailable: res[0].isAvailable,
        isActive: res[0].isActive,
        recipes: []
      };
      
      res.forEach(row => {
        if (row.idRecipe) {
          item.recipes.push({
            idRecipe: row.idRecipe,
            sizeId: row.sizeId,
            ingredientId: row.idIngredient,
            ingredientName: row.ingredientName,
            quantityNeeded: row.quantityNeeded,
            unit: row.unit
          });
        }
      });
      
      result(null, item);
      return;
    }
    result({ kind: "not_found" }, null);
  });
};

MenuItem.updateById = (id, item, result) => {
  db.query(
    `UPDATE MenuItems SET 
      categoryId = ?, 
      itemName = ?, 
      description = ?, 
      basePrice = ?, 
      imageUrl = ?, 
      preparationTime = ?,
      itemType = ?,
      isInventoryItem = ?,
      isAvailable = ?, 
      isActive = ? 
    WHERE idMenuItem = ?`,
    [item.categoryId, item.itemName, item.description, item.basePrice, item.imageUrl, 
     item.preparationTime, item.itemType, item.isInventoryItem, item.isAvailable, item.isActive, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, { id: id, ...item });
    }
  );
};

MenuItem.toggleAvailability = (id, result) => {
  db.query(
    "UPDATE MenuItems SET isAvailable = NOT isAvailable WHERE idMenuItem = ?",
    [id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, res);
    }
  );
};

MenuItem.remove = (id, result) => {
  db.query("DELETE FROM MenuItems WHERE idMenuItem = ?", [id], (err, res) => {
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

module.exports = MenuItem;

