const db = require("./db");

const Purchase = function(purchase) {
  this.purchaseNumber = purchase.purchaseNumber;
  this.supplierName = purchase.supplierName;
  this.supplierPhone = purchase.supplierPhone;
  this.totalAmount = purchase.totalAmount;
  this.purchaseDate = purchase.purchaseDate;
  this.expectedDeliveryDate = purchase.expectedDeliveryDate;
  this.status = purchase.status || 'pending';
  this.createdBy = purchase.createdBy;
  this.notes = purchase.notes;
};

// Create new purchase order
Purchase.create = (newPurchase, items, result) => {
  // Start transaction
  db.getConnection((err, connection) => {
    if (err) {
      result(err, null);
      return;
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        result(err, null);
        return;
      }

      // Insert purchase order
      connection.query("INSERT INTO Purchases SET ?", newPurchase, (err, res) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            result(err, null);
          });
        }

        const purchaseId = res.insertId;

        // Insert purchase items
        if (items && items.length > 0) {
          const itemsData = items.map(item => [
            purchaseId,
            item.ingredientId,
            item.orderedQuantity,
            item.unitPrice,
            item.notes || null
          ]);

          connection.query(
            "INSERT INTO PurchaseItems (purchaseId, ingredientId, orderedQuantity, unitPrice, notes) VALUES ?",
            [itemsData],
            (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  result(err, null);
                });
              }

              // Commit transaction
              connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    result(err, null);
                  });
                }

                connection.release();
                result(null, { id: purchaseId, ...newPurchase });
              });
            }
          );
        } else {
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                result(err, null);
              });
            }

            connection.release();
            result(null, { id: purchaseId, ...newPurchase });
          });
        }
      });
    });
  });
};

// Get all purchases with items count
Purchase.getAll = (limit, result) => {
  const query = `
    SELECT 
      p.*,
      s1.fullName as createdByName,
      s2.fullName as receivedByName,
      COUNT(pi.idPurchaseItem) as itemsCount,
      SUM(pi.orderedQuantity) as totalOrderedQty,
      SUM(pi.receivedQuantity) as totalReceivedQty
    FROM Purchases p
    LEFT JOIN Staff s1 ON p.createdBy = s1.idStaff
    LEFT JOIN Staff s2 ON p.receivedBy = s2.idStaff
    LEFT JOIN PurchaseItems pi ON p.idPurchase = pi.purchaseId
    GROUP BY p.idPurchase
    ORDER BY p.createdAt DESC
    ${limit ? 'LIMIT ?' : ''}
  `;

  const params = limit ? [parseInt(limit)] : [];

  db.query(query, params, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res);
  });
};

// Get single purchase with items
Purchase.findById = (id, result) => {
  const query = `
    SELECT 
      p.*,
      s1.fullName as createdByName,
      s2.fullName as receivedByName
    FROM Purchases p
    LEFT JOIN Staff s1 ON p.createdBy = s1.idStaff
    LEFT JOIN Staff s2 ON p.receivedBy = s2.idStaff
    WHERE p.idPurchase = ?
  `;

  db.query(query, [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }

    if (res.length === 0) {
      result({ kind: "not_found" }, null);
      return;
    }

    // Get purchase items
    const itemsQuery = `
      SELECT 
        pi.*,
        i.ingredientName,
        i.unit,
        i.currentStock
      FROM PurchaseItems pi
      LEFT JOIN Ingredients i ON pi.ingredientId = i.idIngredient
      WHERE pi.purchaseId = ?
    `;

    db.query(itemsQuery, [id], (err, items) => {
      if (err) {
        result(err, null);
        return;
      }

      const purchase = res[0];
      purchase.items = items;
      result(null, purchase);
    });
  });
};

// Receive purchase (update inventory)
Purchase.receive = (id, receivedItems, receivedBy, result) => {
  db.getConnection((err, connection) => {
    if (err) {
      result(err, null);
      return;
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        result(err, null);
        return;
      }

      const fail = (e) => connection.rollback(() => { connection.release(); result(e, null); });
      const userError = (msg) => Object.assign(new Error(msg), { status: 400 });
      const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;

      // Lock the purchase and its items so two receive requests can't both add stock
      connection.query(
        "SELECT idPurchase, purchaseNumber, status, paymentType FROM Purchases WHERE idPurchase = ? FOR UPDATE",
        [id],
        (err, purchaseRows) => {
          if (err) return fail(err);
          if (!purchaseRows.length) return fail(Object.assign(new Error("Purchase not found"), { status: 404 }));
          if (purchaseRows[0].status === "cancelled") return fail(userError("لا يمكن استلام أمر شراء ملغى"));

          connection.query(
            "SELECT idPurchaseItem, ingredientId, orderedQuantity, receivedQuantity, unitPrice FROM PurchaseItems WHERE purchaseId = ? FOR UPDATE",
            [id],
            (err, dbItems) => {
              if (err) return fail(err);
              const byId = new Map(dbItems.map((row) => [Number(row.idPurchaseItem), row]));

              // receivedQuantity from the screen is the new running total for the item.
              // Item and ingredient come from the database, never from the request.
              const changes = [];
              for (const item of receivedItems) {
                const row = byId.get(Number(item.idPurchaseItem));
                if (!row) return fail(userError(`الصنف ${item.idPurchaseItem} لا يتبع أمر الشراء هذا`));
                const newTotal = Number(item.receivedQuantity);
                const ordered = Number(row.orderedQuantity);
                const already = Number(row.receivedQuantity) || 0;
                if (!Number.isFinite(newTotal) || newTotal < 0) return fail(userError("الكمية المستلمة غير صحيحة"));
                if (newTotal < already - 0.0005) {
                  return fail(userError(`لا يمكن تقليل الكمية المستلمة (${already}). استخدم تسوية المخزون بدلاً من ذلك`));
                }
                if (newTotal > ordered + 0.0005) return fail(userError(`الكمية المستلمة (${newTotal}) أكبر من المطلوبة (${ordered})`));
                const diff = round(newTotal - already, 3);
                if (diff > 0) changes.push({ row, newTotal, diff });
              }

              // For each newly received quantity: record it on the item, add it to stock,
              // move the ingredient's cost to the weighted average, and log the movement.
              // Books for what arrived now: Dr inventory; Cr suppliers (credit) or cash box (cash purchase)
              const postReceipt = (next) => {
                const value = round(changes.reduce((t, c) => t + c.diff * Number(c.row.unitPrice), 0), 2);
                if (value <= 0) return next();
                const purchase = purchaseRows[0];
                const memo = `استلام أمر شراء ${purchase.purchaseNumber || "#" + id}`;
                connection.query(
                  `INSERT INTO JournalEntries (entryDate, sourceType, sourceId, status, memo, createdBy, postedBy, postedAt)
                   VALUES (NOW(), 'PURCHASE_RECEIPT', ?, 'POSTED', ?, ?, ?, NOW())`,
                  [id, memo, receivedBy, receivedBy],
                  (err, je) => {
                    if (err) return fail(err);
                    connection.query(
                      `INSERT INTO JournalLines (journalEntryId, accountId, debit, credit, lineMemo)
                       SELECT ?, ps.inventoryAccountId, ?, 0, ? FROM PostingSettings ps WHERE ps.name = 'default'
                       UNION ALL
                       SELECT ?, IF(? = 'cash', ps.cashAccountId, ps.apAccountId), 0, ?, ? FROM PostingSettings ps WHERE ps.name = 'default'`,
                      [je.insertId, value, memo, je.insertId, purchase.paymentType, value, memo],
                      (err) => (err ? fail(err) : next())
                    );
                  }
                );
              };

              const applyChange = (i) => {
                if (i >= changes.length) return postReceipt(updatePurchaseStatus);
                const { row, newTotal, diff } = changes[i];
                const price = Number(row.unitPrice);
                connection.query(
                  "UPDATE PurchaseItems SET receivedQuantity = ? WHERE idPurchaseItem = ?",
                  [newTotal, row.idPurchaseItem],
                  (err) => {
                    if (err) return fail(err);
                    // SET runs left to right: costPerUnit is computed from the stock before this receipt
                    connection.query(
                      `UPDATE Ingredients
                       SET costPerUnit = CASE WHEN GREATEST(currentStock, 0) + ? > 0
                                              THEN ROUND((GREATEST(currentStock, 0) * costPerUnit + ? * ?) / (GREATEST(currentStock, 0) + ?), 2)
                                              ELSE ? END,
                           currentStock = currentStock + ?
                       WHERE idIngredient = ?`,
                      [diff, diff, price, diff, price, diff, row.ingredientId],
                      (err) => {
                        if (err) return fail(err);
                        connection.query(
                          `INSERT INTO InventoryTransactions (ingredientId, transactionType, quantity, costPerUnit, totalCost, orderId, recordedBy, notes)
                           VALUES (?, 'purchase', ?, ?, ?, NULL, ?, ?)`,
                          [row.ingredientId, diff, price, round(diff * price, 2), receivedBy, `استلام من أمر شراء #${id}`],
                          (err) => (err ? fail(err) : applyChange(i + 1))
                        );
                      }
                    );
                  }
                );
              };
              applyChange(0);
            }
          );

          // Helper function to update purchase status
          function updatePurchaseStatus() {
            // First, let's see the actual data
            connection.query(
              `SELECT idPurchaseItem, orderedQuantity, receivedQuantity 
               FROM PurchaseItems 
               WHERE purchaseId = ?`,
              [id],
              (err, items) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    result(err, null);
                  });
                }

                console.log('🔍 Actual items data:', items);

                // Now calculate status
                connection.query(
                  `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN CAST(receivedQuantity AS DECIMAL(10,3)) >= CAST(orderedQuantity AS DECIMAL(10,3)) THEN 1 ELSE 0 END) as fullyReceived,
                    SUM(CASE WHEN CAST(receivedQuantity AS DECIMAL(10,3)) > 0 AND CAST(receivedQuantity AS DECIMAL(10,3)) < CAST(orderedQuantity AS DECIMAL(10,3)) THEN 1 ELSE 0 END) as partiallyReceived
                  FROM PurchaseItems 
                  WHERE purchaseId = ?`,
                  [id],
                  (err, res) => {
                    if (err) {
                      return connection.rollback(() => {
                        connection.release();
                        result(err, null);
                      });
                    }

                    // Convert strings to numbers
                    const total = parseInt(res[0].total);
                    const fullyReceived = parseInt(res[0].fullyReceived) || 0;
                    const partiallyReceived = parseInt(res[0].partiallyReceived) || 0;

                    console.log('📊 Status calculation:', {
                      total,
                      fullyReceived,
                      partiallyReceived
                    });

                    let newStatus = 'pending';
                    if (fullyReceived === total && total > 0) {
                      newStatus = 'received';
                    } else if (partiallyReceived > 0 || fullyReceived > 0) {
                      newStatus = 'partially_received';
                    }

                    console.log('→ New status:', newStatus);

                    // Update purchase status
                    const updateData = {
                      status: newStatus,
                      receivedBy: receivedBy,
                      receivedAt: new Date()
                    };

                    connection.query(
                      "UPDATE Purchases SET ?, updatedAt = NOW() WHERE idPurchase = ?",
                      [updateData, id],
                      (err) => {
                        if (err) {
                          return connection.rollback(() => {
                            connection.release();
                            result(err, null);
                          });
                        }

                        connection.commit((err) => {
                          if (err) {
                            return connection.rollback(() => {
                              connection.release();
                              result(err, null);
                            });
                          }

                          console.log('✅ Transaction committed successfully');
                          connection.release();
                          result(null, { message: "Purchase received successfully", status: newStatus });
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        }
      );
    });
  });
};

// Update purchase
Purchase.updateById = (id, purchase, result) => {
  db.query(
    "UPDATE Purchases SET ?, updatedAt = NOW() WHERE idPurchase = ?",
    [purchase, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }

      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }

      result(null, { id: id, ...purchase });
    }
  );
};

// Delete purchase
Purchase.remove = (id, result) => {
  // A purchase with received goods carries stock and supplier debt; deleting it would
  // erase the debt but keep the stock, so only never-received purchases can be deleted.
  db.query(
    "SELECT COALESCE(SUM(receivedQuantity), 0) AS received FROM PurchaseItems WHERE purchaseId = ?",
    [id],
    (errCheck, rows) => {
      if (errCheck) return result(errCheck, null);
      if (Number(rows[0].received) > 0) {
        return result({ kind: "has_received", message: "لا يمكن حذف أمر شراء تم استلام بضاعة منه" }, null);
      }
      deletePurchase();
    }
  );
  const deletePurchase = () => db.query("DELETE FROM Purchases WHERE idPurchase = ?", [id], (err, res) => {
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

// Generate purchase number
Purchase.generatePurchaseNumber = (result) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  const prefix = `PO-${year}${month}-`;
  
  db.query(
    "SELECT purchaseNumber FROM Purchases WHERE purchaseNumber LIKE ? ORDER BY idPurchase DESC LIMIT 1",
    [`${prefix}%`],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }

      let nextNumber = 1;
      if (res.length > 0) {
        const lastNumber = res[0].purchaseNumber.split('-')[2];
        nextNumber = parseInt(lastNumber) + 1;
      }

      const purchaseNumber = prefix + String(nextNumber).padStart(4, '0');
      result(null, purchaseNumber);
    }
  );
};

module.exports = Purchase;

