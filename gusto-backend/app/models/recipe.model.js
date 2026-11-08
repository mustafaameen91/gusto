const db = require("./db");

const Recipe = function(recipe) {
  this.menuItemId = recipe.menuItemId;
  this.sizeId = recipe.sizeId || null;
  this.ingredientId = recipe.ingredientId;
  this.quantityNeeded = recipe.quantityNeeded;
  this.notes = recipe.notes;
};

Recipe.create = (newRecipe, result) => {
  db.query("INSERT INTO Recipes SET ?", newRecipe, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...newRecipe });
  });
};

Recipe.bulkCreate = (menuItemId, recipes, result) => {
  // First delete existing recipes
  db.query("DELETE FROM Recipes WHERE menuItemId = ?", [menuItemId], (err) => {
    if (err) {
      result(err, null);
      return;
    }

    if (recipes.length === 0) {
      result(null, []);
      return;
    }

    // Insert new recipes (with sizeId support!)
    const recipesData = recipes.map(r => [
      menuItemId,
      r.sizeId || null,  // ⭐ Added sizeId!
      r.ingredientId,
      r.quantityNeeded,
      r.notes || null
    ]);

    db.query(
      "INSERT INTO Recipes (menuItemId, sizeId, ingredientId, quantityNeeded, notes) VALUES ?",
      [recipesData],
      (err, res) => {
        if (err) {
          result(err, null);
          return;
        }
        result(null, res);
      }
    );
  });
};

Recipe.getByMenuItem = (menuItemId, result) => {
  const query = `
    SELECT 
      r.*,
      i.ingredientName,
      i.unit,
      i.currentStock,
      s.sizeName
    FROM Recipes r
    LEFT JOIN Ingredients i ON r.ingredientId = i.idIngredient
    LEFT JOIN ItemSizes s ON r.sizeId = s.idItemSize
    WHERE r.menuItemId = ?
    ORDER BY r.sizeId IS NULL DESC, r.sizeId, r.idRecipe
  `;
  
  db.query(query, [menuItemId], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Recipe.remove = (id, result) => {
  db.query("DELETE FROM Recipes WHERE idRecipe = ?", [id], (err, res) => {
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

Recipe.removeByMenuItem = (menuItemId, result) => {
  db.query("DELETE FROM Recipes WHERE menuItemId = ?", [menuItemId], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

module.exports = Recipe;

