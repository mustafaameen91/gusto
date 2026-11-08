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

      // First, get current received quantities to calculate difference
      const itemIds = receivedItems.map(item => item.idPurchaseItem);
      connection.query(
        "SELECT idPurchaseItem, receivedQuantity FROM PurchaseItems WHERE idPurchaseItem IN (?)",
        [itemIds],
        (err, currentItems) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              result(err, null);
            });
          }

          console.log('📊 Current items before update:', currentItems);

          // Create map of current quantities
          const currentQtyMap = {};
          currentItems.forEach(item => {
            currentQtyMap[item.idPurchaseItem] = parseFloat(item.receivedQuantity) || 0;
          });

          // Calculate NEW quantities (difference only)
          const itemsWithDiff = receivedItems.map(item => {
            const oldQty = currentQtyMap[item.idPurchaseItem] || 0;
            const newTotal = parseFloat(item.receivedQuantity);
            const difference = newTotal - oldQty;
            
            console.log(`  Item ${item.idPurchaseItem}: Old=${oldQty}, New Total=${newTotal}, Diff=${difference}`);
            
            return {
              ...item,
              difference: difference,
              newTotal: newTotal
            };
          });

          // Update purchase items with NEW TOTAL received quantities
          const updatePromises = itemsWithDiff.map(item => {
            return new Promise((resolve, reject) => {
              connection.query(
                "UPDATE PurchaseItems SET receivedQuantity = ? WHERE idPurchaseItem = ?",
                [item.newTotal, item.idPurchaseItem],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          });

          Promise.all(updatePromises)
            .then(() => {
              // Insert inventory transactions for ONLY THE DIFFERENCE (new items received this time)
              const transactions = itemsWithDiff
                .filter(item => item.difference > 0) // Only items with new quantity
                .map(item => [
                  item.ingredientId,
                  'purchase',
                  item.difference, // ⭐ Use DIFFERENCE, not total!
                  null, // orderId
                  receivedBy,
                  `استلام من أمر شراء #${id}`
                ]);

              console.log('📝 Inventory transactions to insert:', transactions);

              if (transactions.length === 0) {
                console.log('⚠️ No new quantities to add to inventory');
                // Still need to update purchase status, continue to next step
                updatePurchaseStatus();
                return;
              }

              // Insert inventory transactions
              connection.query(
                "INSERT INTO InventoryTransactions (ingredientId, transactionType, quantity, orderId, recordedBy, notes) VALUES ?",
                [transactions],
                (err) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      result(err, null);
                    });
                  }
                  console.log('✅ Inventory transactions inserted');
                  updatePurchaseStatus();
                }
              );
            })
            .catch((err) => {
              connection.rollback(() => {
                connection.release();
                result(err, null);
              });
            });

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
  db.query("DELETE FROM Purchases WHERE idPurchase = ?", [id], (err, res) => {
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

