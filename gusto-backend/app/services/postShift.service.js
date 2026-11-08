/**
 * Post Shift — ترحيل الشفت إلى القيود المحاسبية (Pure SQL)
 * Creates one JournalEntry + JournalLines for the shift, then marks it POSTED.
 * Used when closing the shift (DailyReceipts).
 */

const db = require("../models/db");

/**
 * @param {number} dailyReceiptId
 * @param {number} postedBy - Staff id
 * @param {function} result - callback(err, data) where data = { journalEntryId }
 */
function postShift(dailyReceiptId, postedBy, result) {
  const t0 = Date.now();
  console.log(`[postShift] Start dailyReceiptId=${dailyReceiptId}`);
  db.getConnection((err, conn) => {
    if (err) {
      result(err, null);
      return;
    }

    conn.beginTransaction((errTx) => {
      if (errTx) {
        conn.release();
        result(errTx, null);
        return;
      }

      const rollback = (errBack) => {
        console.log(`[postShift] Rollback dailyReceiptId=${dailyReceiptId} after ${Date.now() - t0}ms:`, errBack?.message || errBack);
        conn.rollback(() => {
          conn.release();
          result(errBack || new Error("Rollback"), null);
        });
      };

      // 1) Lock shift and ensure it exists and is open
      conn.query(
        "SELECT * FROM DailyReceipts WHERE idDailyReceipt = ? FOR UPDATE",
        [dailyReceiptId],
        (errRow, rows) => {
          if (errRow) {
            rollback(errRow);
            return;
          }
          if (!rows || rows.length === 0) {
            rollback(new Error("Shift not found"));
            return;
          }
          const shift = rows[0];
          if (shift.isClosed === 1) {
            rollback(new Error("Shift already closed"));
            return;
          }
          console.log(`[postShift] 1_lock ${Date.now() - t0}ms`);

          // 2) Load posting settings
          conn.query(
            "SELECT * FROM PostingSettings WHERE name = 'default' LIMIT 1",
            [],
            (errPs, psRows) => {
              if (errPs) {
                rollback(errPs);
                return;
              }
              if (!psRows || psRows.length === 0) {
                rollback(new Error("PostingSettings 'default' missing. Run seed."));
                return;
              }
              const ps = psRows[0];
              console.log(`[postShift] 2_posting_settings ${Date.now() - t0}ms`);

              // 3) Aggregate sales for this shift (DB enum: cash | credit only; Iraqi GL: cash vs credit/AR)
              conn.query(
                `SELECT
                  SUM(CASE WHEN o.saleType = 'cash' THEN (o.totalAmount) ELSE 0 END) AS cashSales,
                  SUM(CASE WHEN o.saleType = 'credit' THEN (o.totalAmount) ELSE 0 END) AS creditSales,
                  SUM(o.totalAmount) AS totalSales
                FROM Orders o
                WHERE o.dailyReceiptId = ? AND o.status != 'cancelled'`,
                [dailyReceiptId],
                (errSales, salesRows) => {
                  if (errSales) {
                    rollback(errSales);
                    return;
                  }
                  const sales = salesRows[0] || {};
                  const cashSales = Number(sales.cashSales || 0);
                  const creditSales = Number(sales.creditSales || 0);
                  console.log(`[postShift] 3_sales ${Date.now() - t0}ms`);

                  // 3b) Sales by category (food vs beverage) for revenue split when salesDessertsAccountId is set.
                  // Restaurant: drink categories → salesBeveragesAccountId; everything else (food) → salesDessertsAccountId (labelled food sales).
                  conn.query(
                    `SELECT
                      COALESCE(SUM(CASE WHEN NOT (c.categoryName LIKE '%مشروب%' OR c.categoryName LIKE '%عصير%' OR c.categoryName LIKE '%drink%' OR c.categoryName LIKE '%beverage%' OR c.categoryName LIKE '%juice%') THEN (oi.quantity * oi.price) ELSE 0 END), 0) AS dessertSales,
                      COALESCE(SUM(CASE WHEN c.categoryName LIKE '%مشروب%' OR c.categoryName LIKE '%عصير%' OR c.categoryName LIKE '%drink%' OR c.categoryName LIKE '%beverage%' OR c.categoryName LIKE '%juice%' THEN (oi.quantity * oi.price) ELSE 0 END), 0) AS beverageSales
                     FROM OrderItems oi
                     INNER JOIN MenuItems m ON oi.menuItemId = m.idMenuItem
                     INNER JOIN Categories c ON m.categoryId = c.idCategory
                     INNER JOIN Orders o ON oi.orderId = o.idOrder
                     WHERE o.dailyReceiptId = ? AND o.status != 'cancelled'`,
                    [dailyReceiptId],
                    (errCat, catRows) => {
                      if (errCat) {
                        rollback(errCat);
                        return;
                      }
                      const cat = catRows[0] || {};
                      const dessertSales = Number(cat.dessertSales || 0);
                      const beverageSales = Number(cat.beverageSales || 0);
                      console.log(`[postShift] 3b_category ${Date.now() - t0}ms`);

                  // 4) Aggregate expenses for this shift
                  conn.query(
                    `SELECT COALESCE(SUM(amount), 0) AS totalExpenses
                     FROM Expenses WHERE dailyReceiptId = ?`,
                    [dailyReceiptId],
                    (errExp, expRows) => {
                      if (errExp) {
                        rollback(errExp);
                        return;
                      }
                      const totalExp = Number(expRows[0]?.totalExpenses || 0);
                      const totalSales = cashSales + creditSales;
                      const openingCash = Number(shift.openingCash || 0);
                      console.log(`[postShift] 4_expenses ${Date.now() - t0}ms`);
                      // 4a) Other incomes (cash) add to expected cash in drawer
                      conn.query(
                        `SELECT COALESCE(SUM(CASE WHEN paymentMethod = 'cash' THEN amount ELSE 0 END), 0) AS cashTotal
                         FROM OtherIncomes WHERE dailyReceiptId = ?`,
                        [dailyReceiptId],
                        (errOi, oiRows) => {
                          const oiCash = Number(oiRows?.[0]?.cashTotal || 0);
                          if (errOi) {
                            rollback(errOi);
                            return;
                          }
                          const expectedCash = openingCash + totalSales - totalExp + oiCash;
                          console.log(`[postShift] 4a_other_incomes ${Date.now() - t0}ms`);

                      // 4b) Update DailyReceipts totals in same transaction (avoids lock wait from separate updateTotals)
                      conn.query(
                        `UPDATE DailyReceipts SET totalSales = ?, totalExpenses = ?, expectedCash = ? WHERE idDailyReceipt = ?`,
                        [totalSales, totalExp, expectedCash, dailyReceiptId],
                        (errUpd, _updRes) => {
                          if (errUpd) {
                            rollback(errUpd);
                            return;
                          }
                          console.log(`[postShift] 4b_update_daily ${Date.now() - t0}ms`);
                          // 5) COGS from InventoryTransactions (usage) for orders of this shift
                          conn.query(
                        `SELECT COALESCE(SUM(it.totalCost), 0) AS totalCogs
                         FROM InventoryTransactions it
                         INNER JOIN Orders o ON o.idOrder = it.orderId
                         WHERE o.dailyReceiptId = ? AND it.transactionType = 'usage' AND it.totalCost IS NOT NULL`,
                        [dailyReceiptId],
                        (errCogs, cogsRows) => {
                          if (errCogs) {
                            rollback(errCogs);
                            return;
                          }
                          const totalCogs = Number(cogsRows[0]?.totalCogs || 0);
                          console.log(`[postShift] 5_cogs ${Date.now() - t0}ms`);

                          const entryDate = new Date();
                          const memo = `Shift post #${dailyReceiptId}`;

                          // 6) Create Journal Entry (DRAFT)
                          conn.query(
                            `INSERT INTO JournalEntries (entryDate, dailyReceiptId, sourceType, status, memo, createdBy)
                             VALUES (?, ?, 'SHIFT_POST', 'DRAFT', ?, ?)`,
                            [entryDate, dailyReceiptId, memo, postedBy],
                            (errJe, jeRes) => {
                              if (errJe) {
                                rollback(errJe);
                                return;
                              }
                              const journalEntryId = jeRes.insertId;
                              console.log(`[postShift] 6_je_insert ${Date.now() - t0}ms`);

                              const journalLines = [];
                              const addLine = (accountId, debit, credit, lineMemo, cb) => {
                                journalLines.push([journalEntryId, accountId, debit, credit, lineMemo]);
                                cb(null);
                              };

                              // Get expense list: only post expenses with expenseCategoryId + paidFromAccountId (no null fallback; Iraqi GL)
                              conn.query(
                                `SELECT e.idExpense, e.amount, e.expenseCategoryId, ec.defaultAccountId, e.paidFromAccountId
                                 FROM Expenses e
                                 LEFT JOIN ExpenseCategories ec ON ec.idExpenseCategory = e.expenseCategoryId
                                 WHERE e.dailyReceiptId = ?`,
                                [dailyReceiptId],
                                (errExpList, expList) => {
                                  if (errExpList) {
                                    rollback(errExpList);
                                    return;
                                  }
                                  const list = (expList || []).filter(
                                    (e) => e.expenseCategoryId != null && e.paidFromAccountId != null && e.defaultAccountId != null
                                  );
                                  const skipped = (expList || []).length - list.length;
                                  if (skipped > 0) {
                                    console.warn(`[postShift] Skipped ${skipped} expense(s) without expenseCategoryId/paidFromAccountId for GL`);
                                  }
                                  console.log(`[postShift] 7_exp_list ${Date.now() - t0}ms`);
                                  // Other incomes (إيرادات خارجية) for this shift — each row has its incomeAccountId from دليل الحسابات
                                  conn.query(
                                    `SELECT idOtherIncome, amount, paymentMethod, incomeAccountId FROM OtherIncomes WHERE dailyReceiptId = ?`,
                                    [dailyReceiptId],
                                    (errOi, oiList) => {
                                      if (errOi) {
                                        rollback(errOi);
                                        return;
                                      }
                                      const otherIncomes = oiList || [];
                                      console.log(`[postShift] 8_oi_list ${Date.now() - t0}ms`);

                                      // Tips for this shift (tips linked to orders in shift)
                                      conn.query(
                                        `SELECT COALESCE(SUM(t.amount), 0) AS totalTips
                                         FROM Tips t INNER JOIN Orders o ON t.orderId = o.idOrder WHERE o.dailyReceiptId = ?`,
                                        [dailyReceiptId],
                                        (errTips, tipsRows) => {
                                          if (errTips) {
                                            rollback(errTips);
                                            return;
                                          }
                                          const totalTips = Number(tipsRows[0]?.totalTips || 0);
                                          console.log(`[postShift] 9_tips ${Date.now() - t0}ms`);
                                          // Wastage for this shift (waste txns linked to shift orders or same-day standalone)
                                          const receiptDate = shift.receiptDate ? (typeof shift.receiptDate === 'string' ? shift.receiptDate.slice(0, 10) : shift.receiptDate.toISOString().slice(0, 10)) : null;
                                          conn.query(
                                            `SELECT COALESCE(SUM(it.totalCost), 0) AS totalWastage
                                             FROM InventoryTransactions it
                                             LEFT JOIN Orders o ON it.orderId = o.idOrder
                                             WHERE it.transactionType = 'waste' AND it.totalCost IS NOT NULL
                                               AND (o.dailyReceiptId = ? OR (it.orderId IS NULL AND ? IS NOT NULL AND DATE(it.transactionDate) = ?))`,
                                            [dailyReceiptId, receiptDate, receiptDate],
                                            (errWaste, wasteRows) => {
                                              if (errWaste) {
                                                rollback(errWaste);
                                                return;
                                              }
                                              const totalWastage = Number(wasteRows[0]?.totalWastage || 0);
                                              console.log(`[postShift] 10_wastage ${Date.now() - t0}ms`);

                                      let pending = 0;
                                      const useDessertSplit = ps.salesDessertsAccountId && totalSales > 0 && dessertSales > 0;
                                      if (cashSales > 0) pending += useDessertSplit ? 3 : 2;
                                      if (creditSales > 0) pending += useDessertSplit ? 3 : 2;
                                      if (totalCogs > 0) pending += 2;
                                      pending += list.length * 2;
                                      pending += otherIncomes.length * 2;
                                      if (ps.tipsAccountId && totalTips > 0) pending += 2;
                                      if (ps.wastageAccountId && totalWastage > 0) pending += 2;

                                  const doBalanceCheckAndCommit = () => {
                                    console.log(`[postShift] 12_balance_commit ${Date.now() - t0}ms`);
                                    conn.query(
                                      `SELECT ROUND(SUM(debit),2) AS td, ROUND(SUM(credit),2) AS tc
                                       FROM JournalLines WHERE journalEntryId = ?`,
                                      [journalEntryId],
                                      (errBal, balRows) => {
                                        if (errBal) {
                                          rollback(errBal);
                                          return;
                                        }
                                        const td = Number(balRows[0]?.td || 0);
                                        const tc = Number(balRows[0]?.tc || 0);
                                        if (Math.abs(td - tc) > 0.01) {
                                          rollback(new Error(`Journal not balanced: debit=${td} credit=${tc}`));
                                          return;
                                        }
                                        conn.query(
                                          `UPDATE JournalEntries SET status = 'POSTED', postedBy = ?, postedAt = NOW() WHERE idJournalEntry = ?`,
                                          [postedBy, journalEntryId],
                                          (errPost) => {
                                            if (errPost) {
                                              rollback(errPost);
                                              return;
                                            }
                                            conn.commit((errCommit) => {
                                              if (errCommit) {
                                                rollback(errCommit);
                                                return;
                                              }
                                              conn.release();
                                              console.log(`[postShift] Done dailyReceiptId=${dailyReceiptId} in ${Date.now() - t0}ms`);
                                              result(null, { journalEntryId });
                                            });
                                          }
                                        );
                                      }
                                    );
                                  };

                                  const runBalanceCheckAndCommit = () => {
                                    if (journalLines.length === 0) {
                                      // Zero-activity shift: no lines to post, but still mark entry POSTED and commit
                                      console.log(`[postShift] 11_bulk_lines (0 rows, zero-activity shift) ${Date.now() - t0}ms`);
                                      return doBalanceCheckAndCommit();
                                    }
                                    console.log(`[postShift] 11_bulk_lines (${journalLines.length} rows) ${Date.now() - t0}ms`);
                                    conn.query(
                                      `INSERT INTO JournalLines (journalEntryId, accountId, debit, credit, lineMemo) VALUES ?`,
                                      [journalLines],
                                      (errIns) => {
                                        if (errIns) {
                                          rollback(errIns);
                                          return;
                                        }
                                        doBalanceCheckAndCommit();
                                      }
                                    );
                                  };

                                  const lineCb = (errDone) => {
                                    if (errDone) {
                                      rollback(errDone);
                                      return;
                                    }
                                    pending--;
                                    if (pending === 0) runBalanceCheckAndCommit();
                                  };

                                  if (cashSales > 0) {
                                    addLine(ps.cashAccountId, cashSales, 0, "Cash sales", lineCb);
                                    if (useDessertSplit) {
                                      const cashBeverage = totalSales > 0 ? cashSales * (beverageSales / totalSales) : 0;
                                      const cashDessert = cashSales - cashBeverage;
                                      if (cashBeverage > 0) addLine(ps.salesBeveragesAccountId, 0, cashBeverage, "Revenue cash beverages", lineCb);
                                      else lineCb(null);
                                      if (cashDessert > 0) addLine(ps.salesDessertsAccountId, 0, cashDessert, "Revenue cash food", lineCb);
                                      else lineCb(null);
                                    } else {
                                      addLine(ps.salesBeveragesAccountId, 0, cashSales, "Revenue cash", lineCb);
                                    }
                                  }
                                  if (creditSales > 0) {
                                    addLine(ps.arAccountId, creditSales, 0, "Credit sales (AR)", lineCb);
                                    if (useDessertSplit) {
                                      const creditBeverage = totalSales > 0 ? creditSales * (beverageSales / totalSales) : 0;
                                      const creditDessert = creditSales - creditBeverage;
                                      if (creditBeverage > 0) addLine(ps.salesBeveragesAccountId, 0, creditBeverage, "Revenue credit beverages", lineCb);
                                      else lineCb(null);
                                      if (creditDessert > 0) addLine(ps.salesDessertsAccountId, 0, creditDessert, "Revenue credit food", lineCb);
                                      else lineCb(null);
                                    } else {
                                      addLine(ps.salesBeveragesAccountId, 0, creditSales, "Revenue credit", lineCb);
                                    }
                                  }
                                  if (totalCogs > 0) {
                                    addLine(ps.cogsAccountId, totalCogs, 0, "COGS", lineCb);
                                    addLine(ps.inventoryAccountId, 0, totalCogs, "Inventory", lineCb);
                                  }
                                  list.forEach((e) => {
                                    const expenseAccountId = e.defaultAccountId;
                                    const paidFromId = e.paidFromAccountId;
                                    const amt = Number(e.amount || 0);
                                    if (amt <= 0 || !expenseAccountId || !paidFromId) {
                                      lineCb(null);
                                      lineCb(null);
                                      return;
                                    }
                                    addLine(expenseAccountId, amt, 0, "Expense", lineCb);
                                    addLine(paidFromId, 0, amt, "Expense payment", lineCb);
                                  });
                                  otherIncomes.forEach((oi) => {
                                    const amt = Number(oi.amount || 0);
                                    const incomeAccountId = oi.incomeAccountId || ps.otherIncomeAccountId;
                                    if (amt <= 0 || !incomeAccountId) {
                                      lineCb(null);
                                      lineCb(null);
                                      return;
                                    }
                                    const isCash = oi.paymentMethod === "cash";
                                    const debitAccountId = isCash ? ps.cashAccountId : ps.bankAccountId;
                                    if (!debitAccountId) {
                                      lineCb(null);
                                      lineCb(null);
                                      return;
                                    }
                                    addLine(debitAccountId, amt, 0, "Other income", lineCb);
                                    addLine(incomeAccountId, 0, amt, "Other income", lineCb);
                                  });
                                  if (ps.tipsAccountId && totalTips > 0) {
                                    addLine(ps.cashAccountId, totalTips, 0, "Tips", lineCb);
                                    addLine(ps.tipsAccountId, 0, totalTips, "Tips", lineCb);
                                  }
                                  if (ps.wastageAccountId && totalWastage > 0) {
                                    addLine(ps.wastageAccountId, totalWastage, 0, "Wastage", lineCb);
                                    addLine(ps.inventoryAccountId, 0, totalWastage, "Wastage", lineCb);
                                  }
                                  if (pending === 0) runBalanceCheckAndCommit();
                                            }
                                          );
                                        }
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
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
  });
}

module.exports = { postShift };
