const db = require("./db");

const ItemSize = function(itemSize) {
  this.menuItemId = itemSize.menuItemId;
  this.sizeName = itemSize.sizeName;
  this.priceAdjustment = itemSize.priceAdjustment;
  this.isDefault = itemSize.isDefault;
  this.isActive = itemSize.isActive;
};

// Get all sizes for a menu item
ItemSize.getByMenuItem = (menuItemId, result) => {
  db.query(
    `SELECT * FROM ItemSizes WHERE menuItemId = ? AND isActive = 1 ORDER BY priceAdjustment ASC`,
    [menuItemId],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, res);
    }
  );
};

// Create new size
ItemSize.create = (newItemSize, result) => {
  db.query("INSERT INTO ItemSizes SET ?", newItemSize, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { idItemSize: res.insertId, ...newItemSize });
  });
};

// Update size
ItemSize.update = (id, itemSize, result) => {
  db.query(
    "UPDATE ItemSizes SET sizeName = ?, priceAdjustment = ?, isDefault = ?, isActive = ? WHERE idItemSize = ?",
    [itemSize.sizeName, itemSize.priceAdjustment, itemSize.isDefault, itemSize.isActive, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, { idItemSize: id, ...itemSize });
    }
  );
};

// Delete size
ItemSize.delete = (id, result) => {
  // Deactivated, not deleted: past orders and size recipes keep pointing at it
  db.query("UPDATE ItemSizes SET isActive = 0 WHERE idItemSize = ?", [id], (err, res) => {
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

module.exports = ItemSize;

