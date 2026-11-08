const db = require("./db");

const Ingredient = function(ingredient) {
  this.ingredientName = ingredient.ingredientName;
  this.unit = ingredient.unit;
  this.currentStock = ingredient.currentStock;
  this.minStock = ingredient.minStock;
  this.maxStock = ingredient.maxStock;
  this.costPerUnit = ingredient.costPerUnit;
  this.itemType = ingredient.itemType;
  this.notes = ingredient.notes;
  this.isActive = ingredient.isActive;
};

Ingredient.create = (newIngredient, result) => {
  db.query("INSERT INTO Ingredients SET ?", newIngredient, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...newIngredient });
  });
};

Ingredient.findById = (id, result) => {
  db.query("SELECT * FROM Ingredients WHERE idIngredient = ?", [id], (err, res) => {
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

Ingredient.getAll = (result) => {
  db.query("SELECT * FROM Ingredients WHERE isActive = TRUE ORDER BY ingredientName", (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Ingredient.getLowStock = (result) => {
  db.query(
    "SELECT * FROM Ingredients WHERE currentStock <= minStock AND isActive = TRUE ORDER BY currentStock",
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, res);
    }
  );
};

Ingredient.updateById = (id, ingredient, result) => {
  // Build dynamic update query to handle optional fields
  const updates = [];
  const values = [];
  
  if (ingredient.ingredientName !== undefined) {
    updates.push('ingredientName = ?');
    values.push(ingredient.ingredientName);
  }
  if (ingredient.unit !== undefined) {
    updates.push('unit = ?');
    values.push(ingredient.unit);
  }
  // Stock is never set by editing: it only moves through purchases, transfers, sales and
  // stock adjustments, each of which records a movement (an edit form could overwrite a newer figure)
  if (ingredient.minStock !== undefined) {
    updates.push('minStock = ?');
    values.push(ingredient.minStock);
  }
  if (ingredient.maxStock !== undefined) {
    updates.push('maxStock = ?');
    values.push(ingredient.maxStock);
  }
  if (ingredient.costPerUnit !== undefined) {
    updates.push('costPerUnit = ?');
    values.push(ingredient.costPerUnit);
  }
  if (ingredient.itemType !== undefined) {
    updates.push('itemType = ?');
    values.push(ingredient.itemType);
  }
  if (ingredient.notes !== undefined) {
    updates.push('notes = ?');
    values.push(ingredient.notes);
  }
  if (ingredient.isActive !== undefined) {
    updates.push('isActive = ?');
    values.push(ingredient.isActive);
  }
  
  if (updates.length === 0) {
    result({ message: "No fields to update" }, null);
    return;
  }
  
  values.push(id);
  
  const query = `UPDATE Ingredients SET ${updates.join(', ')} WHERE idIngredient = ?`;
  
  db.query(query, values, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.affectedRows == 0) {
      result({ kind: "not_found" }, null);
      return;
    }
    result(null, { id: id, ...ingredient });
  });
};

Ingredient.updateStock = (id, quantity, result) => {
  db.query(
    "UPDATE Ingredients SET currentStock = currentStock + ? WHERE idIngredient = ?",
    [quantity, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, res);
    }
  );
};

Ingredient.remove = (id, result) => {
  db.query("DELETE FROM Ingredients WHERE idIngredient = ?", [id], (err, res) => {
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

module.exports = Ingredient;

