/**
 * Execute a transfer: Main → Barista Internal.
 * Decreases Ingredients.currentStock (Main), increases IngredientStock (Barista), records Transfer.
 */
const db = require("../models/db");
const Transfer = require("../models/transfer.model");

const LOCATION_MAIN = 1;
const LOCATION_BARISTA_INTERNAL = 2;

function executeTransfer(ingredientId, quantity, transferredBy, notes, result) {
  const qty = parseFloat(quantity);
  if (!(qty > 0)) {
    return result(new Error("Quantity must be positive"), null);
  }

  db.getConnection((err, conn) => {
    if (err) return result(err, null);

    conn.beginTransaction((errTx) => {
      if (errTx) {
        conn.release();
        return result(errTx, null);
      }

      const rollback = (errBack) => {
        conn.rollback(() => {
          conn.release();
          result(errBack || new Error("Rollback"), null);
        });
      };

      // 1) Check main stock (Ingredients.currentStock)
      conn.query(
        "SELECT idIngredient, currentStock FROM Ingredients WHERE idIngredient = ? FOR UPDATE",
        [ingredientId],
        (errRow, rows) => {
          if (errRow) return rollback(errRow);
          if (!rows || rows.length === 0) return rollback(new Error("Ingredient not found"));
          const current = parseFloat(rows[0].currentStock || 0);
          if (current < qty) return rollback(new Error("Insufficient stock in main storage"));

          // 2) Decrease main
          conn.query(
            "UPDATE Ingredients SET currentStock = currentStock - ? WHERE idIngredient = ?",
            [qty, ingredientId],
            (errUpd) => {
              if (errUpd) return rollback(errUpd);

              // 3) Increase Barista Internal (upsert)
              conn.query(
                `INSERT INTO IngredientStock (ingredientId, locationId, quantity)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
                [ingredientId, LOCATION_BARISTA_INTERNAL, qty, qty],
                (errStock) => {
                  if (errStock) return rollback(errStock);

                  // 4) Record transfer
                  conn.query(
                    `INSERT INTO Transfers (fromLocationId, toLocationId, ingredientId, quantity, transferredBy, notes)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [LOCATION_MAIN, LOCATION_BARISTA_INTERNAL, ingredientId, qty, transferredBy || null, notes || null],
                    (errTr) => {
                      if (errTr) return rollback(errTr);
                      conn.commit((errCommit) => {
                        if (errCommit) return rollback(errCommit);
                        conn.release();
                        result(null, { ingredientId, quantity: qty, fromLocationId: LOCATION_MAIN, toLocationId: LOCATION_BARISTA_INTERNAL });
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
}

module.exports = { executeTransfer, LOCATION_MAIN, LOCATION_BARISTA_INTERNAL };
