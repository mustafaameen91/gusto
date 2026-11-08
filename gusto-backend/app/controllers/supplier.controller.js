const Supplier = require("../models/supplier.model");
const { todayBusinessDate, businessWindow } = require("../services/businessDay");
const SupplierPayment = require("../models/supplierPayment.model");
const SupplierCredit = require("../models/supplierCredit.model");
const SupplierTransfer = require("../models/supplierTransfer.model");
const Purchase = require("../models/purchase.model");
const Expense = require("../models/expense.model");
const SupplierServiceInvoice = require("../models/supplierServiceInvoice.model");
const db = require("../models/db");

// Create new supplier
exports.create = (req, res) => {
  if (!req.body.supplierName) {
    return res.status(400).json({
      message: "Supplier name is required!"
    });
  }

  const supplier = new Supplier({
    supplierName: req.body.supplierName,
    supplierPhone: req.body.supplierPhone || null,
    supplierAddress: req.body.supplierAddress || null,
    initialDebt: parseFloat(req.body.initialDebt || 0),
    notes: req.body.notes || null,
    isActive: true
  });

  Supplier.create(supplier, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating supplier."
      });
    }
    res.status(201).json(data);
  });
};

// Get all suppliers (with current debt per supplier for list page)
exports.getAll = (req, res) => {
  Supplier.getAllWithBalance((err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving suppliers."
      });
    }
    res.json(data);
  });
};

// Get summary stats for all suppliers
exports.getSummaryStats = (req, res) => {
  Supplier.getSummaryStats((err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving summary stats."
      });
    }
    res.json(data);
  });
};

// Get supplier by ID
exports.findById = (req, res) => {
  Supplier.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Supplier with id ${req.params.id} not found.`
        });
      }
      return res.status(500).json({
        message: err.message || "Error retrieving supplier."
      });
    }
    res.json(data);
  });
};

// Get supplier profile (debt, purchases, payments)
exports.getProfile = (req, res) => {
  const supplierId = parseInt(req.params.id, 10);
  if (isNaN(supplierId)) {
    return res.status(400).json({ message: "Invalid supplier id." });
  }

  Supplier.getProfile(supplierId, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Supplier with id ${req.params.id} not found.`
        });
      }
      return res.status(500).json({
        message: err.message || "Error retrieving supplier profile."
      });
    }

    // Get purchases for this supplier with received value (ما علينا له for this order)
    const purchasesQuery = `
      SELECT 
        p.idPurchase,
        p.purchaseNumber,
        p.purchaseDate,
        p.expectedDeliveryDate,
        p.totalAmount,
        p.status,
        p.paymentType,
        p.supplierName,
        p.createdAt,
        s1.fullName as createdByName,
        (SELECT COALESCE(SUM(pi.receivedQuantity * pi.unitPrice), 0) FROM PurchaseItems pi WHERE pi.purchaseId = p.idPurchase) AS receivedValue
      FROM Purchases p
      LEFT JOIN Staff s1 ON p.createdBy = s1.idStaff
      WHERE p.supplierId = ?
      ORDER BY p.purchaseDate DESC, p.createdAt DESC
    `;

    db.query(purchasesQuery, [supplierId], (err, purchases) => {
      if (err) {
        return res.status(500).json({
          message: err.message || "Error retrieving purchases."
        });
      }

      Expense.getAll({ supplierId }, (err, expenses) => {
        if (err) {
          return res.status(500).json({
            message: err.message || "Error retrieving expenses (payments)."
          });
        }

        SupplierServiceInvoice.getBySupplier(supplierId, (errSvc, serviceInvoices) => {
          if (errSvc) {
            return res.status(500).json({
              message: errSvc.message || "Error retrieving service invoices."
            });
          }
          const invoices = serviceInvoices || [];
          // Every figure comes from the same balance definition as the suppliers list
          Supplier.getBalance(supplierId, (errBal, bal) => {
            if (errBal) {
              return res.status(500).json({ message: errBal.message || "Error retrieving supplier balance." });
            }
            const n = (v) => parseFloat(v) || 0;
            res.json({
              ...data,
              initialDebt: n(bal.initialDebt),
              unpaidPurchases: n(bal.unpaidPurchases),
              totalServiceDebt: n(bal.totalServiceDebt),
              // paid = payments recorded for the supplier + expenses paid to the supplier
              totalPayments: n(bal.totalPayments) + n(bal.totalExpensePayments),
              totalCredits: n(bal.totalCredits),
              transferOut: n(bal.transferOut),
              transferIn: n(bal.transferIn),
              currentDebt: n(bal.currentDebt),
              serviceInvoices: invoices,
              expenses: expenses || [],
              purchases: purchases || []
            });
          });
        });
      });
    });
  });
};

// Update supplier
exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      message: "Data to update can not be empty!"
    });
  }

  const supplier = {};
  if (req.body.supplierName) supplier.supplierName = req.body.supplierName;
  if (req.body.supplierPhone !== undefined) supplier.supplierPhone = req.body.supplierPhone;
  if (req.body.supplierAddress !== undefined) supplier.supplierAddress = req.body.supplierAddress;
  if (req.body.initialDebt !== undefined) supplier.initialDebt = parseFloat(req.body.initialDebt);
  if (req.body.notes !== undefined) supplier.notes = req.body.notes;
  if (req.body.isActive !== undefined) supplier.isActive = req.body.isActive;

  Supplier.updateById(req.params.id, supplier, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Supplier with id ${req.params.id} not found.`
        });
      }
      return res.status(500).json({
        message: err.message || "Error updating supplier."
      });
    }
    res.json(data);
  });
};

// Delete supplier (soft delete)
exports.delete = (req, res) => {
  Supplier.remove(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Supplier with id ${req.params.id} not found.`
        });
      }
      return res.status(500).json({
        message: err.message || "Error deleting supplier."
      });
    }
    res.json({ message: "Supplier deleted successfully." });
  });
};

// Create payment to supplier
exports.createPayment = (req, res) => {
  if (!req.body.amount || !req.body.paymentDate) {
    return res.status(400).json({
      message: "Amount and payment date are required!"
    });
  }
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: "المبلغ يجب أن يكون رقماً أكبر من صفر" });
  }
  Supplier.getBalance(req.params.id, (errBal, bal) => {
    if (errBal) return res.status(404).json({ message: "المورد غير موجود" });
    if (amount > parseFloat(bal.currentDebt || 0) + 0.005) {
      return res.status(400).json({ message: `المبلغ أكبر من المستحق للمورد (${parseFloat(bal.currentDebt || 0).toLocaleString()} د.ع)` });
    }
    recordSupplierPayment(req, res, amount);
  });
};

function recordSupplierPayment(req, res, amount) {
  const payment = new SupplierPayment({
    supplierId: req.params.id,
    amount: parseFloat(req.body.amount),
    paymentDate: req.body.paymentDate,
    paymentMethod: req.body.paymentMethod || 'cash',
    notes: req.body.notes || null,
    recordedBy: req.userId
  });

  SupplierPayment.create(payment, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating payment."
      });
    }
    // Books: Dr suppliers (we owe less), Cr cash box or bank
    const memo = `دفعة للمورد #${req.params.id}`;
    db.query(
      `INSERT INTO JournalEntries (entryDate, sourceType, sourceId, status, memo, createdBy, postedBy, postedAt)
       SELECT ?, 'SUPPLIER_PAYMENT', ?, 'POSTED', ?, ?, ?, NOW() FROM DUAL`,
      [payment.paymentDate, data.id || null, memo, req.userId, req.userId],
      (errJe, je) => {
        if (errJe) console.error("[supplier] payment journal entry failed:", errJe.message);
        else {
          db.query(
            `INSERT INTO JournalLines (journalEntryId, accountId, debit, credit, lineMemo)
             SELECT ?, ps.apAccountId, ?, 0, ? FROM PostingSettings ps WHERE ps.name = 'default'
             UNION ALL
             SELECT ?, IF(? = 'cash', ps.cashAccountId, COALESCE(ps.bankAccountId, ps.cashAccountId)), 0, ?, ? FROM PostingSettings ps WHERE ps.name = 'default'`,
            [je.insertId, amount, memo, je.insertId, payment.paymentMethod, amount, memo],
            (errL) => { if (errL) console.error("[supplier] payment journal lines failed:", errL.message); }
          );
        }
        res.status(201).json(data);
      }
    );
  });
}

// Get payments for supplier
exports.getPayments = (req, res) => {
  SupplierPayment.getBySupplier(req.params.id, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving payments."
      });
    }
    res.json(data);
  });
};

// Create credit (what supplier owes us)
exports.createCredit = (req, res) => {
  if (!req.body.amount || !req.body.creditDate) {
    return res.status(400).json({
      message: "Amount and credit date are required!"
    });
  }
  if (!(Number(req.body.amount) > 0)) {
    return res.status(400).json({ message: "المبلغ يجب أن يكون رقماً أكبر من صفر" });
  }

  const credit = new SupplierCredit({
    supplierId: req.params.id,
    amount: parseFloat(req.body.amount),
    creditDate: req.body.creditDate,
    creditType: req.body.creditType || 'credit',
    description: req.body.description || null,
    purchaseId: req.body.purchaseId || null,
    recordedBy: req.userId
  });

  SupplierCredit.create(credit, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating credit."
      });
    }
    res.status(201).json(data);
  });
};

// Get credits for supplier
exports.getCredits = (req, res) => {
  SupplierCredit.getBySupplier(req.params.id, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving credits."
      });
    }
    res.json(data);
  });
};

// Transfer debt between suppliers (fromSupplierId, toSupplierId, amount)
exports.createTransfer = (req, res) => {
  const fromSupplierId = parseInt(req.body.fromSupplierId, 10);
  const toSupplierId = parseInt(req.body.toSupplierId, 10);
  const amount = parseFloat(req.body.amount);
  const transferDate = req.body.transferDate || todayBusinessDate();
  const notes = req.body.notes || null;

  if (!fromSupplierId || !toSupplierId || fromSupplierId === toSupplierId) {
    return res.status(400).json({
      message: "من المورد وإلى المورد مطلوبان ويجب أن يكونا مختلفين."
    });
  }
  if (amount == null || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      message: "المبلغ يجب أن يكون رقماً موجباً."
    });
  }

  SupplierTransfer.create(
    {
      fromSupplierId,
      toSupplierId,
      amount,
      transferDate,
      notes,
      recordedBy: req.userId || null
    },
    (err, data) => {
      if (err) {
        return res.status(500).json({
          message: err.message || "فشل تحويل الدين."
        });
      }
      res.status(201).json({ message: "تم تحويل الدين بنجاح", data });
    }
  );
};

// --- Service invoices (multi-service per invoice) ---
exports.getServiceInvoices = (req, res) => {
  const supplierId = parseInt(req.params.id, 10);
  if (isNaN(supplierId)) {
    return res.status(400).json({ message: "Invalid supplier id." });
  }
  SupplierServiceInvoice.getBySupplier(supplierId, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving service invoices."
      });
    }
    res.json(data);
  });
};

exports.getServiceInvoiceById = (req, res) => {
  const invoiceId = parseInt(req.params.invoiceId, 10);
  if (isNaN(invoiceId)) {
    return res.status(400).json({ message: "Invalid invoice id." });
  }
  SupplierServiceInvoice.getById(invoiceId, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({ message: "Service invoice not found." });
      }
      return res.status(500).json({
        message: err.message || "Error retrieving service invoice."
      });
    }
    res.json(data);
  });
};

exports.createServiceInvoice = (req, res) => {
  const supplierId = parseInt(req.params.id, 10);
  if (isNaN(supplierId)) {
    return res.status(400).json({ message: "Invalid supplier id." });
  }
  const { invoiceDate, dueDate, notes, items } = req.body;
  if (!invoiceDate || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "invoiceDate and at least one service item (description, amount) are required."
    });
  }
  const invoice = { supplierId, invoiceDate, dueDate: dueDate || null, notes: notes || null };
  SupplierServiceInvoice.create(invoice, items, req.userId, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating service invoice."
      });
    }
    res.status(201).json(data);
  });
};

exports.updateServiceInvoice = (req, res) => {
  const invoiceId = parseInt(req.params.invoiceId, 10);
  if (isNaN(invoiceId)) {
    return res.status(400).json({ message: "Invalid invoice id." });
  }
  const { invoiceDate, dueDate, notes, items } = req.body;
  if (!invoiceDate) {
    return res.status(400).json({ message: "invoiceDate is required." });
  }
  const invoice = { invoiceDate, dueDate: dueDate || null, notes: notes || null };
  const itemList = Array.isArray(items) ? items : [];
  SupplierServiceInvoice.update(invoiceId, invoice, itemList, (err) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({ message: "Service invoice not found." });
      }
      return res.status(500).json({
        message: err.message || "Error updating service invoice."
      });
    }
    res.json({ message: "Service invoice updated." });
  });
};

exports.deleteServiceInvoice = (req, res) => {
  const invoiceId = parseInt(req.params.invoiceId, 10);
  if (isNaN(invoiceId)) {
    return res.status(400).json({ message: "Invalid invoice id." });
  }
  SupplierServiceInvoice.remove(invoiceId, (err) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({ message: "Service invoice not found." });
      }
      return res.status(500).json({
        message: err.message || "Error deleting service invoice."
      });
    }
    res.json({ message: "Service invoice deleted." });
  });
};

