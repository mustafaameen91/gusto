const DailyReceipt = require("../models/dailyReceipt.model");
const { todayBusinessDate, businessWindow } = require("../services/businessDay");
const Order = require("../models/order.model");
const OtherIncome = require("../models/otherIncome.model");
const Expense = require("../models/expense.model");
const { postShift } = require("../services/postShift.service");
const db = require("../models/db");

// Other incomes of the shift, plus cash collected from credit customers, minus cash
// refunds for returns (an exchange where the customer paid extra adds instead),
// minus cash purchases paid from the drawer.
function shiftCashExtras(dailyReceiptId, cb) {
  OtherIncome.getTotalsByShift(dailyReceiptId, (oiErr, oiTotals) => {
    db.query(
      `SELECT COALESCE(SUM(amount), 0)
              - (SELECT COALESCE(SUM(totalRefundAmount), 0) FROM OrderReturns WHERE dailyReceiptId = ? AND refundMethod = 'cash') AS customerCash,
              (SELECT COALESCE(SUM(jl.credit), 0) FROM JournalLines jl
                 JOIN JournalEntries je ON je.idJournalEntry = jl.journalEntryId
                 JOIN PostingSettings ps ON ps.name = 'default' AND jl.accountId = ps.cashAccountId
               WHERE je.sourceType = 'PURCHASE_RECEIPT' AND je.dailyReceiptId = ?) AS cashPurchases
       FROM CustomerReceipts WHERE dailyReceiptId = ? AND paymentMethod = 'cash'`,
      [dailyReceiptId, dailyReceiptId, dailyReceiptId],
      (crErr, crRows) => cb(oiErr, oiTotals, crErr ? 0 : parseFloat(crRows[0].customerCash || 0), crErr ? 0 : parseFloat(crRows[0].cashPurchases || 0))
    );
  });
}

// ============================================================================
// DAILY RECEIPT CRUD OPERATIONS
// ============================================================================

exports.getAll = (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  
  DailyReceipt.getAll(limit, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving daily receipts."
      });
    }
    res.json(data);
  });
};

exports.findById = (req, res) => {
  DailyReceipt.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Daily receipt not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error retrieving daily receipt with id " + req.params.id
      });
    }
    res.json(data);
  });
};

// Fill a shift row with its live totals and the cash expected in the drawer.
// Shared by the shift screen and the cash box so both always show the same number.
function withShiftCash(data, callback) {
  const dailyReceiptId = data.idDailyReceipt || data.id;
  Order.getSummaryByShift(dailyReceiptId, (orderErr, summary) => {
    const ok = !orderErr && summary;
    data.totalSales = ok ? parseFloat(summary.totalSales || 0) : 0;
    data.cashSales = ok ? parseFloat(summary.cashSales || 0) : 0;
    data.cardSales = ok ? parseFloat(summary.cardSales || 0) : 0;
    data.creditSales = ok ? parseFloat(summary.creditSales || 0) : 0;
    data.orderCount = ok ? summary.orderCount || 0 : 0;

    Expense.getTotalByShift(dailyReceiptId, (expErr, expTotals) => {
      const totalExpenses = expTotals && !expErr ? parseFloat(expTotals.totalExpenses || 0) : parseFloat(data.totalExpenses || 0);
      const cashExpenses = expTotals && !expErr ? parseFloat(expTotals.cashExpenses || 0) : totalExpenses;
      data.totalExpenses = totalExpenses;
      data.cashExpenses = cashExpenses;

      shiftCashExtras(dailyReceiptId, (oiErr, oiTotals, customerCash, cashPurchases) => {
        const otherIncomesCash = oiTotals && !oiErr ? (oiTotals.cashTotal || 0) : 0;
        data.totalOtherIncomes = oiTotals && !oiErr ? (oiTotals.total || 0) : 0;
        data.otherIncomesCash = otherIncomesCash;
        data.customerCash = customerCash;
        data.cashPurchases = cashPurchases;
        data.expectedCash = parseFloat(data.openingCash || 0) + data.cashSales - cashExpenses + otherIncomesCash + customerCash - cashPurchases;
        callback(data);
      });
    });
  });
}
exports.withShiftCash = withShiftCash;

exports.getCurrent = (req, res) => {
  const today = todayBusinessDate();

  DailyReceipt.findByDate(today, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: "No open receipt for today"
        });
      }
      return res.status(500).json({
        message: err.message || "Error retrieving current receipt."
      });
    }
    withShiftCash(data, (full) => res.json(full));
  });
};

// ⭐ OPEN CASH REGISTER - Now with cashier selection
// Admin, supervisor, or cashier can open the cash register
exports.open = (req, res) => {
  // Check if user has permission (admin, supervisor, or cashier)
  if (req.userRole !== 'admin' && req.userRole !== 'supervisor' && req.userRole !== 'cashier') {
    return res.status(403).json({
      message: "Only admin, supervisor, or cashier can open the cash register!"
    });
  }

  if (!req.body.openingCash && req.body.openingCash !== 0) {
    return res.status(400).json({
      message: "Opening cash amount is required!"
    });
  }

  const today = todayBusinessDate();
  
  // Check if there's an OPEN receipt (supports multiple shifts per day)
  DailyReceipt.findByDate(today, (err, existing) => {
    // If found an OPEN receipt, can't open another until it's closed
    if (existing && !existing.isClosed) {
      return res.status(400).json({
        message: "A cash register is already open! Please close it before opening a new shift."
      });
    }
    
    // If error is not "not_found", it's a real error
    if (err && err.kind !== "not_found") {
      return res.status(500).json({
        message: "Error checking existing receipt"
      });
    }
    
    // No open receipt found - OK to open new shift
    // Calculate shift number for today (ensure numeric: MySQL COUNT can return string)
    DailyReceipt.countByDate(today, (countErr, count) => {
      const shiftNumber = (parseInt(count, 10) || 0) + 1;
      
      // Calculate existing sales for today (in case box is opened after some orders)
      Order.getDailySummary(today, (summaryErr, summary) => {
        const existingSales = summary && !summaryErr ? parseFloat(summary.totalSales || 0) : 0;
        const openingCash = parseFloat(req.body.openingCash || 0);
        
        const receiptData = {
          receiptDate: today,
          shiftNumber: shiftNumber,
          openingCash: openingCash,
          totalSales: existingSales, // Include existing sales if any
          totalExpenses: 0,
          closingCash: 0,
          expectedCash: openingCash + existingSales, // Opening + existing sales
          discrepancy: 0,
          openedBy: req.body.cashierId || req.userId,
          openedAt: new Date(),
          isClosed: false,
          notes: req.body.notes || null
        };
        
        DailyReceipt.open(receiptData, (err, data) => {
          if (err) {
            return res.status(500).json({
              message: err.message || "Error opening cash register."
            });
          }
          // Frontend expects idDailyReceipt for close URL
          const payload = { ...data, idDailyReceipt: data.id ?? data.idDailyReceipt };
          res.json({
            message: `Cash register opened successfully - Shift ${shiftNumber}`,
            data: payload
          });
        });
      });
    });
  });
};

// Close cash register
// Admin, supervisor, or cashier can close the cash register
exports.close = (req, res) => {
  // Check if user has permission (admin, supervisor, or cashier)
  if (req.userRole !== 'admin' && req.userRole !== 'supervisor' && req.userRole !== 'cashier') {
    return res.status(403).json({
      message: "Only admin, supervisor, or cashier can close the cash register!"
    });
  }

  if (!req.body.closingCash && req.body.closingCash !== 0) {
    return res.status(400).json({
      message: "Closing cash amount is required!"
    });
  }

  const today = todayBusinessDate();
  const dailyReceiptId = parseInt(req.params.id, 10);
  const closeStart = Date.now();
  console.log(`[close] Start dailyReceiptId=${dailyReceiptId}`);

  const sent = () => res.headersSent;
  const sendOnce = (status, body) => {
    if (sent()) return;
    if (status) res.status(status);
    res.json(body);
  };

  // Get receipt first
  DailyReceipt.findById(req.params.id, (err, receipt) => {
    if (err) {
      if (err.kind === "not_found") {
        return sendOnce(404, { message: "Daily receipt not found" });
      }
      return sendOnce(500, { message: "Error retrieving receipt" });
    }

    const openingCash = parseFloat(receipt.openingCash) || 0;

    // Shift-level sales (cash vs credit)
    Order.getSummaryByShift(dailyReceiptId, (orderErr, summary) => {
      const cashSales = summary && !orderErr ? parseFloat(summary.cashSales || 0) : 0;
      const cardSales = summary && !orderErr ? parseFloat(summary.cardSales || 0) : 0;
      const creditSales = summary && !orderErr ? parseFloat(summary.creditSales || 0) : 0;
      const totalSales = summary && !orderErr ? parseFloat(summary.totalSales || 0) : 0;
      const orderCount = summary && !orderErr ? (summary.orderCount || 0) : 0;

      Expense.getTotalByShift(dailyReceiptId, (expErr, expTotals) => {
        const totalExpenses = expTotals && !expErr ? parseFloat(expTotals.totalExpenses || 0) : parseFloat(receipt.totalExpenses || 0);
        const cashExpenses = expTotals && !expErr ? parseFloat(expTotals.cashExpenses || 0) : totalExpenses;

        shiftCashExtras(dailyReceiptId, (oiErr, oiTotals, customerCash, cashPurchases) => {
          const otherIncomesCash = oiTotals && !oiErr ? (oiTotals.cashTotal || 0) : 0;
          const totalOtherIncomes = oiTotals && !oiErr ? (oiTotals.total || 0) : 0;

          const expectedCash = openingCash + cashSales - cashExpenses + otherIncomesCash + customerCash - cashPurchases;
          const closingCash = parseFloat(req.body.closingCash);
          const discrepancy = closingCash - expectedCash;

          const closingData = {
            closingCash: closingCash,
            expectedCash: expectedCash,
            discrepancy: discrepancy,
            closedBy: req.userId,
            notes: req.body.notes || receipt.notes
          };

          const runPostShift = () => {
            const postShiftStart = Date.now();
            console.log(`[close] postShift started dailyReceiptId=${dailyReceiptId} (elapsed ${postShiftStart - closeStart}ms)`);
            postShift(dailyReceiptId, req.userId, (postErr) => {
              console.log(`[close] postShift finished in ${Date.now() - postShiftStart}ms (total ${Date.now() - closeStart}ms)`);
              if (postErr) {
                console.error("[close] Post Shift error:", postErr?.message || postErr);
                if (postErr.message === "Shift already posted" || postErr.message === "Shift already closed") {
                  return sendOnce(409, { message: "هذا الشفت أُغلق ورُحّل بالفعل" });
                }
                return sendOnce(500, {
                  message: postErr.message || "ترحيل الشفت فشل. تأكد من وجود PostingSettings والحسابات."
                });
              }

              DailyReceipt.close(req.params.id, closingData, (err, data) => {
                if (err) {
                  if (err.kind === "not_found") {
                    return sendOnce(404, { message: "Daily receipt not found" });
                  }
                  return sendOnce(500, { message: err.message || "Error closing cash register." });
                }

                const nextOpeningCash = req.body.nextShiftOpeningCash != null
                  ? parseFloat(req.body.nextShiftOpeningCash)
                  : closingCash;
                DailyReceipt.countByDate(today, (countErr, count) => {
                  const shiftNumber = (count || 0) + 1;
                  const newReceiptData = {
                    receiptDate: today,
                    shiftNumber,
                    openingCash: nextOpeningCash,
                    totalSales: 0,
                    totalExpenses: 0,
                    closingCash: 0,
                    expectedCash: nextOpeningCash,
                    discrepancy: 0,
                    openedBy: req.userId,
                    openedAt: new Date(),
                    isClosed: false,
                    notes: null
                  };
                  DailyReceipt.open(newReceiptData, (openErr, newShift) => {
                    if (openErr) console.error("Auto-open shift error:", openErr);
                    sendOnce(null, {
                      message: "Cash register closed successfully",
                      summary: {
                        openingCash,
                        cashSales,
                        cardSales,
                        creditSales,
                        totalSales,
                        orderCount,
                        totalExpenses,
                        totalOtherIncomes,
                        otherIncomesCash,
                        customerCash,
                        cashPurchases,
                        expectedCash,
                        closingCash,
                        discrepancy,
                        receiptDate: receipt.receiptDate,
                        shiftNumber: receipt.shiftNumber
                      },
                      journalPosted: true,
                      newShift: openErr ? null : (newShift && { id: newShift.id, shiftNumber, openingCash: nextOpeningCash })
                    });
                  });
                });
              });
            });
          };

          const cashCounts = Array.isArray(req.body.cashCounts) && req.body.cashCounts.length > 0
            ? req.body.cashCounts
                .filter((r) => r.denomination != null && r.quantity != null)
                .map((r) => [dailyReceiptId, Number(r.denomination), Number(r.quantity)])
            : [];

          if (cashCounts.length === 0) {
            runPostShift();
            return;
          }

          const cashCountStart = Date.now();
          console.log(`[close] ShiftCashCounts transaction start dailyReceiptId=${dailyReceiptId} rows=${cashCounts.length}`);
          db.getConnection((connErr, conn) => {
            if (connErr) {
              return sendOnce(500, { message: connErr.message || "Database error." });
            }
            conn.beginTransaction((txErr) => {
              if (txErr) {
                conn.release();
                return sendOnce(500, { message: txErr.message || "Transaction error." });
              }
              conn.query("SELECT idDailyReceipt FROM DailyReceipts WHERE idDailyReceipt = ? FOR UPDATE", [dailyReceiptId], (lockErr) => {
                if (lockErr) {
                  conn.rollback(() => { conn.release(); });
                  return sendOnce(500, { message: lockErr.message || "Lock error." });
                }
                conn.query("DELETE FROM ShiftCashCounts WHERE dailyReceiptId = ?", [dailyReceiptId], (delErr) => {
                  if (delErr) {
                    conn.rollback(() => { conn.release(); });
                    return sendOnce(500, { message: delErr.message || "Delete error." });
                  }
                  conn.query(
                    "INSERT INTO ShiftCashCounts (dailyReceiptId, denomination, quantity) VALUES ?",
                    [cashCounts],
                    (insErr) => {
                      if (insErr) {
                        conn.rollback(() => { conn.release(); });
                        return sendOnce(500, { message: insErr.message || "Insert error." });
                      }
                      conn.commit((commitErr) => {
                        if (commitErr) {
                          conn.rollback(() => { conn.release(); });
                          return sendOnce(500, { message: commitErr.message || "Commit error." });
                        }
                        conn.release();
                        console.log(`[close] ShiftCashCounts transaction done in ${Date.now() - cashCountStart}ms`);
                        runPostShift();
                      });
                    }
                  );
                });
              });
            });
          });
        });
      });
    });
  });
};

// Get cash counts for a specific daily receipt
exports.getCashCounts = (req, res) => {
  const dailyReceiptId = req.params.id;
  db.query(
    `SELECT denomination, quantity FROM ShiftCashCounts WHERE dailyReceiptId = ? ORDER BY denomination ASC`,
    [dailyReceiptId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: err.message || "Error retrieving cash counts."
        });
      }
      res.json(rows || []);
    }
  );
};

module.exports = exports;

