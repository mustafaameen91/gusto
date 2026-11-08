const db = require("./db");

const KitchenItemStock = {};

// Get all kitchen menu items with current quantity (only rows with quantity > 0 or all for admin)
KitchenItemStock.getMenu = (includeZero = false, result) => {
  const having = includeZero ? "" : " HAVING k.quantity > 0";
  const query = `
    SELECT k.menuItemId, k.quantity, k.updatedAt,
           m.itemName, m.basePrice, m.imageUrl,
           c.categoryName, c.idCategory
    FROM KitchenItemStock k
    INNER JOIN MenuItems m ON k.menuItemId = m.idMenuItem
    LEFT JOIN Categories c ON m.categoryId = c.idCategory
    WHERE m.isActive = 1
    ${having}
    ORDER BY c.displayOrder, m.itemName
  `;
  db.query(query, [], (err, rows) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, rows || []);
  });
};

KitchenItemStock.getByMenuItem = (menuItemId, result) => {
  db.query(
    "SELECT * FROM KitchenItemStock WHERE menuItemId = ?",
    [menuItemId],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, rows && rows[0] ? rows[0] : null);
    }
  );
};

KitchenItemStock.add = (menuItemId, quantity, result) => {
  const q = Math.max(0, parseInt(quantity, 10) || 0);
  if (q === 0) {
    result(null, { menuItemId, quantity: 0 });
    return;
  }
  db.query(
    `INSERT INTO KitchenItemStock (menuItemId, quantity)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
    [menuItemId, q, q],
    (err) => {
      if (err) {
        result(err, null);
        return;
      }
      KitchenItemStock.getByMenuItem(menuItemId, result);
    }
  );
};

KitchenItemStock.decrease = (menuItemId, quantity, result) => {
  const q = Math.max(0, parseInt(quantity, 10) || 0);
  if (q === 0) {
    return KitchenItemStock.getByMenuItem(menuItemId, result);
  }
  db.query(
    "UPDATE KitchenItemStock SET quantity = quantity - ? WHERE menuItemId = ? AND quantity >= ?",
    [q, menuItemId, q],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows === 0) {
        result(new Error("Insufficient kitchen stock or item not in kitchen stock"), null);
        return;
      }
      KitchenItemStock.getByMenuItem(menuItemId, result);
    }
  );
};

KitchenItemStock.setQuantity = (menuItemId, quantity, result) => {
  const q = Math.max(0, parseInt(quantity, 10) || 0);
  db.query(
    `INSERT INTO KitchenItemStock (menuItemId, quantity)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE quantity = ?`,
    [menuItemId, q, q],
    (err) => {
      if (err) {
        result(err, null);
        return;
      }
      KitchenItemStock.getByMenuItem(menuItemId, result);
    }
  );
};

module.exports = KitchenItemStock;
