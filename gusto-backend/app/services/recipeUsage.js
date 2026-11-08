// Use or give back a dish's recipe ingredients in the kitchen internal store (location 2),
// recording the movement and its cost against a shift so shift close posts cost of goods sold.
// `q` is a promise-returning query function bound to a transaction connection.
const KITCHEN_STORE = 2;
const round2 = (n) => Math.round(n * 100) / 100;

// Recipe lines for a menu item; a size's own recipe wins over the base recipe
async function recipeLines(q, menuItemId, itemSizeId) {
  const rows = await q(
    `SELECT r.ingredientId, r.quantityNeeded, r.sizeId, i.costPerUnit, m.itemType
     FROM Recipes r
     JOIN Ingredients i ON i.idIngredient = r.ingredientId
     JOIN MenuItems m ON m.idMenuItem = r.menuItemId
     WHERE r.menuItemId = ?`,
    [menuItemId]
  );
  if (!rows.length || rows[0].itemType !== "recipe") return [];
  const sized = itemSizeId ? rows.filter((r) => Number(r.sizeId) === Number(itemSizeId)) : [];
  return sized.length ? sized : rows.filter((r) => !r.sizeId);
}

/**
 * direction 'use'     → take from the kitchen store, cost of goods goes up
 * direction 'restore' → put back (cancel / returned to stock), cost goes down at the cost
 *                       originally charged for this order when it can be found
 */
async function moveIngredients(q, { menuItemId, itemSizeId = null, quantity, direction, orderId = null, dailyReceiptId = null, userId = null, note }) {
  const lines = await recipeLines(q, menuItemId, itemSizeId);
  for (const r of lines) {
    const qty = Number(r.quantityNeeded) * quantity;
    let unitCost = Number(r.costPerUnit) || 0;
    if (direction === "restore" && orderId) {
      const [orig] = await q(
        `SELECT costPerUnit FROM InventoryTransactions
         WHERE orderId = ? AND ingredientId = ? AND transactionType = 'usage' AND quantity < 0
         ORDER BY idTransaction DESC LIMIT 1`,
        [orderId, r.ingredientId]
      );
      if (orig && orig.costPerUnit != null) unitCost = Number(orig.costPerUnit);
    }
    const sign = direction === "use" ? -1 : 1;
    await q(
      `INSERT INTO InventoryTransactions (ingredientId, transactionType, quantity, costPerUnit, totalCost, orderId, dailyReceiptId, recordedBy, notes)
       VALUES (?, 'usage', ?, ?, ?, ?, ?, ?, ?)`,
      [r.ingredientId, sign * qty, unitCost, -sign * round2(qty * unitCost), orderId, dailyReceiptId, userId, note]
    );
    await q(
      `INSERT INTO IngredientStock (ingredientId, locationId, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [r.ingredientId, KITCHEN_STORE, sign * qty]
    );
  }
}

module.exports = { recipeLines, moveIngredients };
