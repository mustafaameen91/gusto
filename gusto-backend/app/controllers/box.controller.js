const db = require("../models/db");
const { todayBusinessDate, businessWindow } = require("../services/businessDay");
const Expense = require("../models/expense.model");
const Purchase = require("../models/purchase.model");
const Order = require("../models/order.model");
const DailyReceipt = require("../models/dailyReceipt.model");
const OtherIncome = require("../models/otherIncome.model");
const PostingSettings = require("../models/postingSettings.model");

// Get current cash box balance
exports.getBalance = (req, res) => {
  const today = todayBusinessDate();
  
  // Get current open receipt
  DailyReceipt.findByDate(today, (err, receipt) => {
    if (err && err.kind !== "not_found") {
      return res.status(500).json({
        message: err.message || "Error retrieving cash box balance."
      });
    }
    
    // If no open receipt, check if there's a closed receipt for today
    if (!receipt) {
      // Try to get the last closed receipt for today
      const closedReceiptQuery = `
        SELECT * FROM DailyReceipts 
        WHERE receiptDate = ? AND isClosed = TRUE 
        ORDER BY closedAt DESC 
        LIMIT 1
      `;
      
      db.query(closedReceiptQuery, [today], (err, closedReceipts) => {
        if (err) {
          return res.status(500).json({
            message: err.message || "Error retrieving closed receipt."
          });
        }
        
        // If there's a closed receipt, calculate all values properly
        if (closedReceipts && closedReceipts.length > 0) {
          const closedReceipt = closedReceipts[0];
          
          // Get actual sales for the date (might be more accurate than stored value)
          Order.getDailySummary(today, (err, salesSummary) => {
            const totalSales = parseFloat(salesSummary?.totalSales || closedReceipt.totalSales || 0);
            
            // Get actual expenses for the date
            Expense.getTotal(today, today, (err, expenseTotal) => {
              const totalExpenses = parseFloat(expenseTotal?.totalExpenses || closedReceipt.totalExpenses || 0);
              
              // Get actual purchases for the date
              const purchaseQuery = `
                SELECT COALESCE(SUM(totalAmount), 0) as totalPurchases
                FROM Purchases
                WHERE DATE(purchaseDate) = ? 
                  AND status IN ('received', 'partially_received')
              `;
              
              db.query(purchaseQuery, [today], (err, purchaseResult) => {
                if (err) {
                  return res.status(500).json({
                    message: err.message || "Error retrieving purchases."
                  });
                }
                
                const totalPurchases = parseFloat(purchaseResult[0]?.totalPurchases || 0);
                const openingCash = parseFloat(closedReceipt.openingCash || 0);
                
                // For closed receipt, use the actual closing cash
                const currentBalance = parseFloat(closedReceipt.closingCash || 0);
                const expectedBalance = parseFloat(closedReceipt.expectedCash || 0);
                
                // Other incomes for this closed shift (were included in expectedCash at close)
                OtherIncome.getTotalsByShift(closedReceipt.idDailyReceipt, (oiErr, oiTotals) => {
                  const totalOtherIncomes = oiTotals && !oiErr ? (oiTotals.total || 0) : 0;
                  return res.json({
                    openingCash: openingCash,
                    totalSales: totalSales,
                    totalExpenses: totalExpenses,
                    totalPurchases: totalPurchases,
                    totalOtherIncomes: totalOtherIncomes,
                    currentBalance: currentBalance,
                    expectedBalance: expectedBalance,
                    receiptDate: closedReceipt.receiptDate,
                    isOpen: false,
                    isClosed: true,
                    closingCash: currentBalance
                  });
                });
              });
            });
          });
          return; // Exit early
        }
        
        // No receipt at all for today
        return res.json({
          openingCash: 0,
          totalSales: 0,
          totalExpenses: 0,
          totalPurchases: 0,
          totalOtherIncomes: 0,
          currentBalance: 0,
          expectedBalance: 0,
          isOpen: false,
          isClosed: false
        });
      });
      return; // Exit early
    }
    
    // Open shift: the box holds exactly what the shift screen expects in the drawer
    const { withShiftCash } = require("./dailyReceipt.controller");
    withShiftCash({ ...receipt }, (shift) => {
      res.json({
        openingCash: parseFloat(receipt.openingCash || 0),
        totalSales: shift.totalSales,
        cashSales: shift.cashSales,
        cardSales: shift.cardSales,
        creditSales: shift.creditSales,
        totalExpenses: shift.totalExpenses,
        cashExpenses: shift.cashExpenses,
        totalPurchases: 0,
        totalOtherIncomes: shift.totalOtherIncomes,
        otherIncomesCash: shift.otherIncomesCash,
        customerCash: shift.customerCash,
        currentBalance: shift.expectedCash,
        expectedBalance: shift.expectedCash,
        receiptDate: receipt.receiptDate,
        isOpen: !receipt.isClosed,
        isClosed: false
      });
    });
  });
};

// Get box summary (daily/weekly/monthly)
exports.getSummary = (req, res) => {
  const { todayBusinessDate, addDays, businessWindow } = require("../services/businessDay");
  const period = req.query.period || 'today'; // today, week, month
  const today = todayBusinessDate();
  let startDate, endDate = today;
  switch (period) {
    case 'today':
      startDate = today;
      break;
    case 'week': // the last 7 business days including today
      startDate = addDays(today, -6);
      break;
    case 'month':
      startDate = today.slice(0, 8) + '01';
      break;
    default:
      startDate = req.query.startDate || today;
      endDate = req.query.endDate || today;
  }

  // Sales over the same business-day window as every other report (07:00 → 02:59)
  const window = businessWindow(startDate, endDate);
  const salesQuery = `
    SELECT
      COALESCE(SUM(totalAmount), 0) as totalSales,
      COUNT(*) as orderCount
    FROM Orders
    WHERE orderDate >= ? AND orderDate <= ?
      AND status != 'cancelled'
  `;
  const salesParams = [window.startDateTime, window.endDateTime];

  // Get expenses
  Expense.getTotal(startDate, endDate, (err, expenseTotal) => {
    const totalExpenses = parseFloat(expenseTotal?.totalExpenses || 0);
    
    // Get purchases
    const purchaseQuery = `
      SELECT COALESCE(SUM(totalAmount), 0) as totalPurchases,
             COUNT(*) as purchaseCount
      FROM Purchases
      WHERE DATE(purchaseDate) >= ? AND DATE(purchaseDate) <= ?
        AND status IN ('received', 'partially_received')
    `;
    
    db.query(salesQuery, salesParams, (err, salesResult) => {
      if (err) {
        return res.status(500).json({
          message: err.message || "Error retrieving sales summary."
        });
      }
      
      const totalSales = parseFloat(salesResult[0]?.totalSales || 0);
      const orderCount = parseInt(salesResult[0]?.orderCount || 0);
      
      db.query(purchaseQuery, [startDate, endDate], (err, purchaseResult) => {
        if (err) {
          return res.status(500).json({
            message: err.message || "Error retrieving purchase summary."
          });
        }
        
        const totalPurchases = parseFloat(purchaseResult[0]?.totalPurchases || 0);
        const purchaseCount = parseInt(purchaseResult[0]?.purchaseCount || 0);
        
        const { profitForPeriod } = require("../services/profit.service");
        profitForPeriod(startDate, endDate, (errProfit, pf) => {
        if (errProfit) return res.status(500).json({ message: errProfit.message });
        res.json({
          period: period,
          startDate: startDate,
          endDate: endDate,
          totalSales: totalSales,
          totalExpenses: totalExpenses,
          totalPurchases: totalPurchases,
          netProfit: pf.netProfit,
          grossProfit: pf.grossProfit,
          cogs: pf.cogs,
          orderCount: orderCount,
          purchaseCount: purchaseCount,
          expenseCount: expenseTotal?.expenseCount || 0
        });
        });
      });
    });
  });
};

// Get all transactions (sales, expenses, purchases)
exports.getTransactions = (req, res) => {
  const startDate = req.query.startDate || todayBusinessDate();
  const endDate = req.query.endDate || todayBusinessDate();
  
  const transactions = [];
  
  // Business day 03:00 → 02:59 (shared definition); ranges use the same window
  const getCafeDayRange = (date) => businessWindow(date, date);

  // Get sales (orders) - use cafe day logic for single day
  let salesQuery, salesParams;
  if (startDate === endDate) {
    const cafeDay = getCafeDayRange(startDate);
    salesQuery = `
      SELECT 
        idOrder as id,
        'sale' as type,
        orderNumber as reference,
        totalAmount as amount,
        orderDate as date,
        'مبيعات' as description,
        cashierId as userId
      FROM Orders
      WHERE orderDate >= ? AND orderDate <= ?
        AND status != 'cancelled'
      ORDER BY orderDate DESC
    `;
    salesParams = [cafeDay.startDateTime, cafeDay.endDateTime];
  } else {
    salesQuery = `
      SELECT 
        idOrder as id,
        'sale' as type,
        orderNumber as reference,
        totalAmount as amount,
        orderDate as date,
        'مبيعات' as description,
        cashierId as userId
      FROM Orders
      WHERE orderDate >= ? AND orderDate <= ?
        AND status != 'cancelled'
      ORDER BY orderDate DESC
    `;
    salesParams = [businessWindow(startDate, endDate).startDateTime, businessWindow(startDate, endDate).endDateTime];
  }
  
  // Get expenses
  const expensesQuery = `
    SELECT 
      e.idExpense as id,
      'expense' as type,
      e.receiptNumber as reference,
      e.amount,
      e.expenseDate as date,
      CONCAT(e.category, ' - ', COALESCE(e.description, '')) as description,
      e.recordedBy as userId
    FROM Expenses e
    WHERE e.expenseDate >= ? AND e.expenseDate <= ?
    ORDER BY e.expenseDate DESC
  `;
  
  // Get purchases
  const purchasesQuery = `
    SELECT 
      p.idPurchase as id,
      'purchase' as type,
      p.purchaseNumber as reference,
      p.totalAmount as amount,
      p.purchaseDate as date,
      CONCAT('شراء من ', p.supplierName) as description,
      p.createdBy as userId
    FROM Purchases p
    WHERE DATE(p.purchaseDate) >= ? AND DATE(p.purchaseDate) <= ?
      AND p.status IN ('received', 'partially_received')
    ORDER BY p.purchaseDate DESC
  `;
  
  db.query(salesQuery, salesParams, (err, sales) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving sales transactions."
      });
    }
    
    db.query(expensesQuery, [startDate, endDate], (err, expenses) => {
      if (err) {
        return res.status(500).json({
          message: err.message || "Error retrieving expense transactions."
        });
      }
      
      db.query(purchasesQuery, [startDate, endDate], (err, purchases) => {
        if (err) {
          return res.status(500).json({
            message: err.message || "Error retrieving purchase transactions."
          });
        }

        // Get other incomes for the date range (shift-linked + unlinked)
        OtherIncome.getListForTransactions(startDate, endDate, (oiErr, otherIncomes) => {
          const oiList = otherIncomes || [];
          const oiTxns = oiList.map(oi => ({
            id: oi.idOtherIncome,
            type: 'other_income',
            reference: null,
            amount: parseFloat(oi.amount || 0),
            date: oi.date,
            description: oi.incomeAccountName ? `إيرادات خارجية: ${oi.incomeAccountName}` : 'إيرادات خارجية',
            userId: null
          }));
        
          // Combine all transactions
          transactions.push(...sales.map(s => ({ ...s, amount: parseFloat(s.amount) })));
          transactions.push(...expenses.map(e => ({ ...e, amount: -parseFloat(e.amount) })));
          transactions.push(...purchases.map(p => ({ ...p, amount: -parseFloat(p.amount) })));
          transactions.push(...oiTxns);
        
          // Sort by date descending
          transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
          res.json(transactions);
        });
      });
    });
  });
};

// Get per-account balances from JournalLines
exports.getAccountBalances = (req, res) => {
  const query = `
    SELECT
      a.idAccount,
      a.code        AS accountCode,
      a.name        AS accountName,
      a.accountType,
      COALESCE(SUM(jl.debit), 0)  AS totalDebit,
      COALESCE(SUM(jl.credit), 0) AS totalCredit,
      COUNT(jl.idJournalLine)      AS transactionCount
    FROM Accounts a
    LEFT JOIN JournalLines jl ON jl.accountId = a.idAccount
    WHERE a.isActive = 1
    GROUP BY a.idAccount, a.code, a.name, a.accountType
    ORDER BY a.code ASC
  `;

  db.query(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving account balances."
      });
    }

    const result = (rows || []).map(r => {
      const totalDebit  = parseFloat(r.totalDebit)  || 0;
      const totalCredit = parseFloat(r.totalCredit) || 0;
      const type = (r.accountType || '').toUpperCase();
      const isDebitNormal = ['ASSET', 'EXPENSE', 'COST'].includes(type);
      const balance = isDebitNormal
        ? totalDebit - totalCredit
        : totalCredit - totalDebit;

      return {
        idAccount: r.idAccount,
        accountCode: r.accountCode,
        accountName: r.accountName,
        accountType: r.accountType,
        totalDebit,
        totalCredit,
        balance,
        transactionCount: parseInt(r.transactionCount) || 0
      };
    });

    res.json(result);
  });
};

// Get transactions for a specific account
exports.getAccountTransactions = (req, res) => {
  const accountId = req.params.accountId;
  const startDate = req.query.startDate || null;
  const endDate   = req.query.endDate   || null;

  let query = `
    SELECT
      jl.idJournalLine,
      jl.debit,
      jl.credit,
      jl.lineMemo,
      je.idJournalEntry,
      je.entryDate,
      je.sourceType,
      je.memo AS entryMemo,
      je.dailyReceiptId
    FROM JournalLines jl
    JOIN JournalEntries je ON je.idJournalEntry = jl.journalEntryId
    WHERE jl.accountId = ?
  `;
  const params = [accountId];

  if (startDate) {
    query += ` AND je.entryDate >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND je.entryDate <= ?`;
    params.push(endDate);
  }

  query += ` ORDER BY je.entryDate DESC, jl.idJournalLine DESC`;

  db.query(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving account transactions."
      });
    }
    const list = (rows || []).map(r => ({
      idJournalLine: r.idJournalLine,
      debit: parseFloat(r.debit) || 0,
      credit: parseFloat(r.credit) || 0,
      lineMemo: r.lineMemo,
      entryDate: r.entryDate,
      sourceType: r.sourceType,
      entryMemo: r.entryMemo,
      dailyReceiptId: r.dailyReceiptId
    }));
    res.json(list);
  });
};

// Transfer money between boxes/accounts (e.g. cash ↔ bank)
exports.transfer = (req, res) => {
  const fromAccountId = req.body.fromAccountId != null ? parseInt(req.body.fromAccountId, 10) : null;
  const toAccountId = req.body.toAccountId != null ? parseInt(req.body.toAccountId, 10) : null;
  const amount = parseFloat(req.body.amount);
  const notes = req.body.notes || null;

  if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
    return res.status(400).json({
      message: "من الحساب وإلى الحساب مطلوبان ويجب أن يكونا مختلفين."
    });
  }
  if (amount == null || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      message: "المبلغ يجب أن يكون رقماً موجباً."
    });
  }

  PostingSettings.getByName("default", (errPs, ps) => {
    if (errPs || !ps) {
      return res.status(500).json({ message: "لم يتم العثور على إعدادات الترحيل." });
    }

    const entryDate = new Date().toISOString().slice(0, 19).replace("T", " ");
    const memo = notes || "تحويل بين الصناديق";
    const userId = req.userId || null;

    db.query(
      `INSERT INTO JournalEntries (entryDate, sourceType, status, memo, createdBy)
       VALUES (?, 'TRANSFER', 'POSTED', ?, ?)`,
      [entryDate, memo, userId],
      (errJe, jeRes) => {
        if (errJe) {
          return res.status(500).json({
            message: errJe.message || "فشل إنشاء القيد المحاسبي."
          });
        }
        const journalEntryId = jeRes.insertId;
        const lines = [
          [journalEntryId, toAccountId, amount, 0, memo],
          [journalEntryId, fromAccountId, 0, amount, memo]
        ];
        db.query(
          `INSERT INTO JournalLines (journalEntryId, accountId, debit, credit, lineMemo) VALUES ?`,
          [lines],
          (errLines) => {
            if (errLines) {
              db.query("DELETE FROM JournalEntries WHERE idJournalEntry = ?", [journalEntryId], () => {});
              return res.status(500).json({
                message: errLines.message || "فشل تسجيل القيد."
              });
            }
            res.status(201).json({
              message: "تم التحويل بنجاح",
              journalEntryId,
              fromAccountId,
              toAccountId,
              amount
            });
          }
        );
      }
    );
  });
};

module.exports = exports;

