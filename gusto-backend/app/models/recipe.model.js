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

// Replaces the item's whole recipe set (base lines with sizeId NULL + per-size lines).
// The caller must send the complete set. Delete + insert run in one transaction so a
// failed insert can't leave the item with no recipe.
Recipe.bulkCreate = (menuItemId, recipes, result) => {
  const toSizeId = (v) => {
    const n = Number(v);
    return v === null || v === undefined || v === "" || !Number.isFinite(n) || n <= 0 ? null : n;
  };

  db.getConnection((errConn, conn) => {
    if (errConn) {
      result(errConn, null);
      return;
    }
    const fail = (err) => conn.rollback(() => { conn.release(); result(err, null); });

    conn.beginTransaction((errTx) => {
      if (errTx) {
        conn.release();
        result(errTx, null);
        return;
      }

      conn.query("DELETE FROM Recipes WHERE menuItemId = ?", [menuItemId], (errDel) => {
        if (errDel) return fail(errDel);

        const finish = (data) => {
          conn.commit((errCommit) => {
            if (errCommit) return fail(errCommit);
            conn.release();
            result(null, data);
          });
        };

        if (recipes.length === 0) return finish({ affectedRows: 0 });

        const recipesData = recipes.map(r => [
          menuItemId,
          toSizeId(r.sizeId),
          r.ingredientId,
          r.quantityNeeded,
          r.notes || null
        ]);

        conn.query(
          "INSERT INTO Recipes (menuItemId, sizeId, ingredientId, quantityNeeded, notes) VALUES ?",
          [recipesData],
          (errIns, res) => {
            if (errIns) return fail(errIns);
            finish(res);
          }
        );
      });
    });
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

