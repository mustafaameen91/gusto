const OtherIncome = require("../models/otherIncome.model");
const { todayBusinessDate, businessWindow, localDateTime } = require("../services/businessDay");
const PostingSettings = require("../models/postingSettings.model");
const db = require("../models/db");

/**
 * Post a standalone (non-shift) other income to GL immediately.
 * Debit cash/bank, credit income account. So it shows in Box account balances.
 */
function postStandaloneOtherIncome(otherIncomeRecord, userId, cb) {
  const amount = Number(otherIncomeRecord.amount || 0);
  const incomeAccountId = otherIncomeRecord.incomeAccountId;
  const paymentMethod = otherIncomeRecord.paymentMethod || "cash";
  const incomeDate = otherIncomeRecord.incomeDate;
  const notes = otherIncomeRecord.notes || "";

  if (amount <= 0 || !incomeAccountId) {
    return cb(null);
  }

  PostingSettings.getByName("default", (errPs, ps) => {
    if (errPs || !ps) {
      console.warn("[otherIncome] PostingSettings not found, skipping GL post:", errPs?.message);
      return cb(null);
    }
    const isCash = paymentMethod === "cash";
    const debitAccountId = isCash ? ps.cashAccountId : ps.bankAccountId;
    if (!debitAccountId) {
      console.warn("[otherIncome] No cash/bank account in PostingSettings, skipping GL post");
      return cb(null);
    }

    const memo = `إيراد خارجي${notes ? `: ${notes}` : ""}`.trim();
    const entryDate = incomeDate
      ? `${String(incomeDate).slice(0, 10)} 12:00:00`
      : localDateTime();

    db.query(
      `INSERT INTO JournalEntries (entryDate, sourceType, status, memo, createdBy)
       VALUES (?, 'OTHER', 'POSTED', ?, ?)`,
      [entryDate, memo, userId || null],
      (errJe, jeRes) => {
        if (errJe) {
          console.error("[otherIncome] Failed to create journal entry:", errJe);
          return cb(errJe);
        }
        const journalEntryId = jeRes.insertId;
        const lines = [
          [journalEntryId, debitAccountId, amount, 0, memo],
          [journalEntryId, incomeAccountId, 0, amount, memo]
        ];
        db.query(
          `INSERT INTO JournalLines (journalEntryId, accountId, debit, credit, lineMemo) VALUES ?`,
          [lines],
          (errLines) => {
            if (errLines) {
              console.error("[otherIncome] Failed to create journal lines:", errLines);
              return cb(errLines);
            }
            cb(null);
          }
        );
      }
    );
  });
}

exports.list = (req, res) => {
  const filters = {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    dailyReceiptId: req.query.dailyReceiptId,
    limit: req.query.limit || 200
  };
  OtherIncome.getAll(filters, (err, data) => {
    if (err) {
      console.error("[GET /api/other-incomes] Error:", err.message);
      return res.status(500).json({
        message: err.message || "Error retrieving other incomes."
      });
    }
    res.json(data);
  });
};

exports.create = (req, res) => {
  const amount = parseFloat(req.body.amount);
  if (amount == null || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      message: "Amount is required and must be a positive number."
    });
  }
  const incomeAccountId = req.body.incomeAccountId != null ? parseInt(req.body.incomeAccountId, 10) : null;
  if (incomeAccountId == null || isNaN(incomeAccountId)) {
    return res.status(400).json({
      message: "نوع الإيراد (incomeAccountId) مطلوب — اختر حساباً من نوع إيرادات من دليل الحسابات."
    });
  }

  const data = {
    incomeDate: req.body.incomeDate || todayBusinessDate(),
    amount,
    incomeAccountId,
    paymentMethod: req.body.paymentMethod === "bank" ? "bank" : "cash",
    dailyReceiptId: req.body.dailyReceiptId || null,
    recordedBy: req.userId || null,
    notes: req.body.notes || null
  };

  OtherIncome.create(data, (err, created) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating other income."
      });
    }
    // When NOT linked to shift: post to GL immediately so it shows in Box account balances
    if (!data.dailyReceiptId) {
      postStandaloneOtherIncome(created, req.userId || null, (postErr) => {
        if (postErr) {
          console.error("[otherIncome] GL post failed:", postErr);
          // Still return 201 — the record was created; GL post can be retried manually if needed
        }
        res.status(201).json(created);
      });
    } else {
      res.status(201).json(created);
    }
  });
};
