const Expense = require("../models/expense.model");
const { todayBusinessDate, businessWindow } = require("../services/businessDay");
const DailyReceipt = require("../models/dailyReceipt.model");
const db = require("../models/db");

// Ensure the journalEntryId column exists on Expenses (self-healing migration)
let _colChecked = false;
function ensureJournalEntryIdColumn() {
  if (_colChecked) return;
  _colChecked = true;
  db.query(
    `ALTER TABLE Expenses ADD COLUMN journalEntryId INT DEFAULT NULL`,
    (err) => {
      if (err && err.code !== 'ER_DUP_FIELDNAME') {
        console.warn('[expense] Could not add journalEntryId column:', err.code);
      }
    }
  );
}

// Auto-add column on load
ensureJournalEntryIdColumn();

// Upload expense photo
exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image file provided!"
    });
  }

  // Return the relative URL path
  const imageUrl = `/uploads/${req.file.filename}`;
  
  res.json({
    message: "Image uploaded successfully",
    imageUrl: imageUrl,
    filename: req.file.filename
  });
};

// Create new expense (GL-connected: expenseCategoryId and paidFromAccountId required for proper posting)
function attachToOpenShiftIfCash(expense, next) {
  if (expense.dailyReceiptId) return next();
  db.query(
    `SELECT dr.idDailyReceipt, ps.cashAccountId
     FROM DailyReceipts dr LEFT JOIN PostingSettings ps ON ps.name = 'default'
     WHERE dr.isClosed = 0 ORDER BY dr.idDailyReceipt DESC LIMIT 1`,
    (err, rows) => {
      const row = !err && rows && rows[0];
      const paidFromCash = row && (expense.paidFromAccountId == null || Number(expense.paidFromAccountId) === Number(row.cashAccountId));
      if (paidFromCash) expense.dailyReceiptId = row.idDailyReceipt;
      next();
    }
  );
}

// Amount must be a positive number; a payment to a supplier can't exceed what we owe them
function validateExpenseAmount(body, excludeExpenseId, cb) {
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return cb("المبلغ يجب أن يكون رقماً أكبر من صفر");
  if (!body.supplierId) return cb(null);
  const Supplier = require("../models/supplier.model");
  Supplier.getBalance(body.supplierId, (err, bal) => {
    if (err) return cb("المورد غير موجود");
    // When editing, the expense's own old amount is already counted as paid
    const finish = (oldAmount) => {
      const owed = parseFloat(bal.currentDebt || 0) + oldAmount;
      if (amount > owed + 0.005) return cb(`المبلغ أكبر من المستحق للمورد (${owed.toLocaleString()} د.ع)`);
      cb(null);
    };
    if (!excludeExpenseId) return finish(0);
    db.query("SELECT amount, supplierId FROM Expenses WHERE idExpense = ?", [excludeExpenseId], (e, rows) => {
      const old = rows && rows[0] && Number(rows[0].supplierId) === Number(body.supplierId) ? Number(rows[0].amount) : 0;
      finish(old);
    });
  });
}

exports.create = (req, res) => {
  if (!req.body.expenseDate || !req.body.amount) {
    return res.status(400).json({
      message: "Expense date and amount are required!"
    });
  }
  if (req.body.expenseCategoryId == null || req.body.paidFromAccountId == null) {
    return res.status(400).json({
      message: "expenseCategoryId and paidFromAccountId are required for GL posting (دليل الحسابات)."
    });
  }
  const categoryName = req.body.category && req.body.category.trim() ? req.body.category.trim() : null;
  if (!categoryName) {
    return res.status(400).json({
      message: "Category name (category) is required!"
    });
  }

  const expense = {
    expenseDate: req.body.expenseDate,
    category: categoryName,
    amount: req.body.amount,
    expenseCategoryId: req.body.expenseCategoryId,
    paidFromAccountId: req.body.paidFromAccountId,
    description: req.body.description || null,
    receiptNumber: req.body.receiptNumber || null,
    recordedBy: req.userId,
    dailyReceiptId: req.body.dailyReceiptId || null
  };
  if (req.body.supplierId != null) expense.supplierId = req.body.supplierId;

  if (req.body.photoUrl !== undefined) {
    expense.photoUrl = req.body.photoUrl || null;
  }

  // Money paid from the cash box leaves the drawer of the open shift: attach it so
  // the shift's expected cash drops. Bank-paid expenses don't touch the drawer.
  validateExpenseAmount(req.body, null, (problem) => {
    if (problem) return res.status(400).json({ message: problem });
  attachToOpenShiftIfCash(expense, () => Expense.create(expense, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating expense."
      });
    }
    
    // Update daily receipt total expenses if linked
    if (expense.dailyReceiptId) {
      updateDailyReceiptExpenses(expense.dailyReceiptId);
    }

    // Post journal entry (debit expense account, credit paid-from account)
    const expenseId = data.id || data.idExpense;
    createExpenseJournalEntry(
      expenseId,
      expense.expenseDate,
      expense.amount,
      expense.expenseCategoryId,
      expense.paidFromAccountId,
      expense.description || expense.category,
      req.userId,
      expense.supplierId
    );
    
    res.json(data);
  }));
  });
};

// Get all expenses
exports.findAll = (req, res) => {
  const filters = {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    category: req.query.category,
    dailyReceiptId: req.query.dailyReceiptId,
    supplierId: req.query.supplierId || null,
    limit: req.query.limit
  };
  
  Expense.getAll(filters, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving expenses."
      });
    }
    res.json(data);
  });
};

// Get single expense
exports.findOne = (req, res) => {
  Expense.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Expense not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error retrieving expense with id " + req.params.id
      });
    }
    res.json(data);
  });
};

// Update expense (GL: expenseCategoryId and paidFromAccountId required)
exports.update = (req, res) => {
  if (!req.body.expenseDate || !req.body.amount) {
    return res.status(400).json({
      message: "Expense date and amount are required!"
    });
  }
  validateExpenseAmount(req.body, req.params.id, (problem) => {
    if (problem) return res.status(400).json({ message: problem });
    updateExpense(req, res);
  });
};

function updateExpense(req, res) {
  if (req.body.expenseCategoryId == null || req.body.paidFromAccountId == null) {
    return res.status(400).json({
      message: "expenseCategoryId and paidFromAccountId are required for GL posting (دليل الحسابات)."
    });
  }
  const categoryName = req.body.category && req.body.category.trim() ? req.body.category.trim() : null;
  if (!categoryName) {
    return res.status(400).json({
      message: "Category name (category) is required!"
    });
  }

  const expense = {
    expenseDate: req.body.expenseDate,
    category: categoryName,
    amount: req.body.amount,
    expenseCategoryId: req.body.expenseCategoryId,
    paidFromAccountId: req.body.paidFromAccountId,
    description: req.body.description || null,
    receiptNumber: req.body.receiptNumber || null,
    dailyReceiptId: req.body.dailyReceiptId || null
  };
  if (req.body.supplierId !== undefined) expense.supplierId = req.body.supplierId || null;

  if (req.body.photoUrl !== undefined) {
    expense.photoUrl = req.body.photoUrl || null;
  }

  // Get old expense to check if dailyReceiptId changed
  Expense.findById(req.params.id, (err, oldExpense) => {
    if (err) {
      return res.status(500).json({
        message: "Error retrieving expense"
      });
    }

    // Reverse old journal entry, update expense, then create new journal entry
    reverseExpenseJournalEntry(req.params.id, () => {
      Expense.updateById(req.params.id, expense, (err, data) => {
        if (err) {
          console.error("Error updating expense:", err);
          if (err.kind === "not_found") {
            return res.status(404).json({
              message: `Expense not found with id ${req.params.id}.`
            });
          }
          return res.status(500).json({
            message: "Error updating expense with id " + req.params.id,
            error: err.message || err
          });
        }
        
        if (oldExpense.dailyReceiptId) {
          updateDailyReceiptExpenses(oldExpense.dailyReceiptId);
        }
        if (expense.dailyReceiptId && expense.dailyReceiptId !== oldExpense.dailyReceiptId) {
          updateDailyReceiptExpenses(expense.dailyReceiptId);
        }

        createExpenseJournalEntry(
          req.params.id,
          expense.expenseDate,
          expense.amount,
          expense.expenseCategoryId,
          expense.paidFromAccountId,
          expense.description || expense.category,
          req.userId,
          expense.supplierId
        );
        
        res.json(data);
      });
    });
  });
}

// Delete expense
exports.delete = (req, res) => {
  // Get expense before deleting to update daily receipt
  Expense.findById(req.params.id, (err, expense) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Expense not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error retrieving expense"
      });
    }

    // Reverse journal entry first, then delete the expense
    reverseExpenseJournalEntry(req.params.id, () => {
      Expense.remove(req.params.id, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            return res.status(404).json({
              message: `Expense not found with id ${req.params.id}.`
            });
          }
          return res.status(500).json({
            message: "Could not delete expense with id " + req.params.id
          });
        }
        
        if (expense.dailyReceiptId) {
          updateDailyReceiptExpenses(expense.dailyReceiptId);
        }
        
        res.json({ message: "Expense deleted successfully!" });
      });
    });
  });
};

// Get expense summary
exports.getSummary = (req, res) => {
  const startDate = req.query.startDate || todayBusinessDate();
  const endDate = req.query.endDate || todayBusinessDate();
  
  Expense.getSummary(startDate, endDate, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving expense summary."
      });
    }
    res.json(data);
  });
};

// Get total expenses
exports.getTotal = (req, res) => {
  const startDate = req.query.startDate || todayBusinessDate();
  const endDate = req.query.endDate || todayBusinessDate();
  
  Expense.getTotal(startDate, endDate, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving total expenses."
      });
    }
    res.json(data);
  });
};

/**
 * Create a journal entry for an expense:
 *   Debit  -> expense account (from ExpenseCategory.defaultAccountId)
 *   Credit -> paid-from account (paidFromAccountId, e.g. cash)
 */
function createExpenseJournalEntry(expenseId, expenseDate, amount, expenseCategoryId, paidFromAccountId, description, userId, supplierId) {
  db.query(
    `SELECT ec.defaultAccountId, ps.apAccountId
     FROM ExpenseCategories ec LEFT JOIN PostingSettings ps ON ps.name = 'default'
     WHERE ec.idExpenseCategory = ?`,
    [expenseCategoryId],
    (err, rows) => {
      if (err || !rows || rows.length === 0) {
        console.error('[expense] Could not find expense category for journal entry:', expenseCategoryId, err);
        return;
      }
      // Paying a supplier settles what we owe them (the goods are already in stock),
      // so it debits the suppliers account instead of an expense account
      const expenseAccountId = supplierId && rows[0].apAccountId ? rows[0].apAccountId : rows[0].defaultAccountId;
      if (!expenseAccountId) {
        console.error('[expense] Expense category has no defaultAccountId:', expenseCategoryId);
        return;
      }

      const memo = `مصروف: ${description || ''}`.trim();
      db.query(
        `INSERT INTO JournalEntries (entryDate, sourceType, status, memo, createdBy)
         VALUES (?, 'EXPENSE', 'POSTED', ?, ?)`,
        [expenseDate, memo, userId],
        (errJe, jeRes) => {
          if (errJe) {
            console.error('[expense] Failed to create journal entry:', errJe);
            return;
          }
          const journalEntryId = jeRes.insertId;
          const lines = [
            [journalEntryId, expenseAccountId, parseFloat(amount), 0, memo],
            [journalEntryId, paidFromAccountId, 0, parseFloat(amount), memo]
          ];
          db.query(
            `INSERT INTO JournalLines (journalEntryId, accountId, debit, credit, lineMemo) VALUES ?`,
            [lines],
            (errLines) => {
              if (errLines) {
                console.error('[expense] Failed to create journal lines:', errLines);
                return;
              }
              // Link the journal entry to the expense for later reversal
              db.query(
                `UPDATE Expenses SET journalEntryId = ? WHERE idExpense = ?`,
                [journalEntryId, expenseId],
                (errLink) => {
                  if (errLink) {
                    console.warn('[expense] Could not link journalEntryId to expense (column may not exist yet):', errLink.code);
                  }
                }
              );
            }
          );
        }
      );
    }
  );
}

/**
 * Reverse (delete) the journal entry linked to an expense.
 */
function reverseExpenseJournalEntry(expenseId, callback) {
  db.query(
    `SELECT journalEntryId FROM Expenses WHERE idExpense = ?`,
    [expenseId],
    (err, rows) => {
      if (err || !rows || rows.length === 0 || !rows[0].journalEntryId) {
        if (callback) callback();
        return;
      }
      const jeId = rows[0].journalEntryId;
      db.query(`DELETE FROM JournalLines WHERE journalEntryId = ?`, [jeId], () => {
        db.query(`DELETE FROM JournalEntries WHERE idJournalEntry = ?`, [jeId], () => {
          if (callback) callback();
        });
      });
    }
  );
}

// Helper function to update daily receipt total expenses
function updateDailyReceiptExpenses(dailyReceiptId) {
  Expense.getTotal(null, null, (err, total) => {
    if (!err && total) {
      // Get expenses for this specific receipt
      Expense.getAll({ dailyReceiptId: dailyReceiptId }, (err, expenses) => {
        if (!err && expenses) {
          const receiptTotal = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
          DailyReceipt.updateTotals(dailyReceiptId, { totalExpenses: receiptTotal }, () => {});
        }
      });
    }
  });
}

module.exports = exports;

