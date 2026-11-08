const db = require("./db");

const IngredientStock = {};

IngredientStock.getByLocation = (locationId, result) => {
  const query = `
    SELECT s.*, i.ingredientName, i.unit
    FROM IngredientStock s
    INNER JOIN Ingredients i ON s.ingredientId = i.idIngredient
    WHERE s.locationId = ? AND i.isActive = 1
    ORDER BY i.ingredientName
  `;
  db.query(query, [locationId], (err, rows) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, rows || []);
  });
};

IngredientStock.getByIngredient = (ingredientId, result) => {
  const query = `
    SELECT s.*, l.name AS locationName, l.code AS locationCode
    FROM IngredientStock s
    INNER JOIN StorageLocations l ON s.locationId = l.idStorageLocation
    WHERE s.ingredientId = ?
  `;
  db.query(query, [ingredientId], (err, rows) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, rows || []);
  });
};

IngredientStock.getOne = (ingredientId, locationId, result) => {
  db.query(
    "SELECT * FROM IngredientStock WHERE ingredientId = ? AND locationId = ?",
    [ingredientId, locationId],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, rows && rows[0] ? rows[0] : null);
    }
  );
};

IngredientStock.upsert = (ingredientId, locationId, quantityDelta, result) => {
  db.query(
    `INSERT INTO IngredientStock (ingredientId, locationId, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
    [ingredientId, locationId, quantityDelta, quantityDelta],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      IngredientStock.getOne(ingredientId, locationId, result);
    }
  );
};

IngredientStock.setQuantity = (ingredientId, locationId, quantity, result) => {
  db.query(
    `INSERT INTO IngredientStock (ingredientId, locationId, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = ?`,
    [ingredientId, locationId, quantity, quantity],
    (err) => {
      if (err) {
        result(err, null);
        return;
      }
      IngredientStock.getOne(ingredientId, locationId, result);
    }
  );
};

module.exports = IngredientStock;
