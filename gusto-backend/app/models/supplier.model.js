const db = require("./db");

const Supplier = function(supplier) {
  this.supplierName = supplier.supplierName;
  this.supplierPhone = supplier.supplierPhone;
  this.supplierAddress = supplier.supplierAddress || null;
  this.initialDebt = supplier.initialDebt || 0;
  this.notes = supplier.notes || null;
  this.isActive = supplier.isActive !== undefined ? supplier.isActive : true;
};

// Create new supplier
Supplier.create = (newSupplier, result) => {
  db.query("INSERT INTO Suppliers SET ?", newSupplier, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { id: res.insertId, ...newSupplier });
  });
};

// Get all suppliers
Supplier.getAll = (result) => {
  db.query(
    "SELECT * FROM Suppliers WHERE isActive = TRUE ORDER BY supplierName",
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, res);
    }
  );
};

// The one definition of what we owe each supplier, used by the list, profile and summary:
// Debt = initialDebt + received value of credit purchases + service invoices
//        - supplier payments - expenses paid to the supplier
//        - supplier credits (returns/refunds/advances: they reduce what we owe)
//        - transfers out + transfers in
const balanceQuery = (onlyOne) => `
    SELECT
      s.idSupplier,
      s.supplierName,
      s.supplierPhone,
      s.supplierAddress,
      s.initialDebt,
      s.notes,
      s.isActive,
      COALESCE(p.unpaidPurchases, 0) AS unpaidPurchases,
      COALESCE(svc.totalServiceDebt, 0) AS totalServiceDebt,
      COALESCE(cr.totalCredits, 0) AS totalCredits,
      COALESCE(pay.totalPayments, 0) AS totalPayments,
      COALESCE(exp.totalExpensePayments, 0) AS totalExpensePayments,
      COALESCE(stOut.totalOut, 0) AS transferOut,
      COALESCE(stIn.totalIn, 0) AS transferIn,
      (COALESCE(s.initialDebt, 0)
        + COALESCE(p.unpaidPurchases, 0)
        + COALESCE(svc.totalServiceDebt, 0)
        - COALESCE(cr.totalCredits, 0)
        - COALESCE(pay.totalPayments, 0)
        - COALESCE(exp.totalExpensePayments, 0)
        - COALESCE(stOut.totalOut, 0)
        + COALESCE(stIn.totalIn, 0)
      ) AS currentDebt
    FROM Suppliers s
    LEFT JOIN (
      SELECT p.supplierId, COALESCE(SUM(pi.receivedQuantity * pi.unitPrice), 0) AS unpaidPurchases
      FROM Purchases p
      INNER JOIN PurchaseItems pi ON pi.purchaseId = p.idPurchase
      WHERE p.supplierId IS NOT NULL
        AND (p.paymentType IS NULL OR p.paymentType = 'credit')
        AND p.status <> 'cancelled'
      GROUP BY p.supplierId
    ) p ON p.supplierId = s.idSupplier
    LEFT JOIN (
      SELECT i.supplierId,
        SUM((SELECT COALESCE(SUM(it.amount), 0) FROM SupplierServiceInvoiceItems it WHERE it.invoiceId = i.idSupplierServiceInvoice)) AS totalServiceDebt
      FROM SupplierServiceInvoices i
      GROUP BY i.supplierId
    ) svc ON svc.supplierId = s.idSupplier
    LEFT JOIN (
      SELECT supplierId, SUM(amount) AS totalCredits
      FROM SupplierCredits
      GROUP BY supplierId
    ) cr ON cr.supplierId = s.idSupplier
    LEFT JOIN (
      SELECT supplierId, SUM(amount) AS totalPayments
      FROM SupplierPayments
      GROUP BY supplierId
    ) pay ON pay.supplierId = s.idSupplier
    LEFT JOIN (
      SELECT supplierId, SUM(amount) AS totalExpensePayments
      FROM Expenses WHERE supplierId IS NOT NULL
      GROUP BY supplierId
    ) exp ON exp.supplierId = s.idSupplier
    LEFT JOIN (SELECT fromSupplierId, SUM(amount) AS totalOut FROM SupplierTransfers GROUP BY fromSupplierId) stOut ON stOut.fromSupplierId = s.idSupplier
    LEFT JOIN (SELECT toSupplierId, SUM(amount) AS totalIn FROM SupplierTransfers GROUP BY toSupplierId) stIn ON stIn.toSupplierId = s.idSupplier
    WHERE ${onlyOne ? "s.idSupplier = ?" : "s.isActive = TRUE"}
    ORDER BY s.supplierName
  `;

// Get all suppliers with current debt (what we owe them)
Supplier.getAllWithBalance = (result) => {
  db.query(balanceQuery(false), [], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res || []);
  });
};

// Get supplier by ID
Supplier.findById = (id, result) => {
  db.query("SELECT * FROM Suppliers WHERE idSupplier = ?", [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.length) {
      result(null, res[0]);
      return;
    }
    result({ kind: "not_found" }, null);
  });
};

// Update supplier
Supplier.updateById = (id, supplier, result) => {
  db.query(
    "UPDATE Suppliers SET ? WHERE idSupplier = ?",
    [supplier, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, { id: id, ...supplier });
    }
  );
};

// Delete supplier (soft delete)
Supplier.remove = (id, result) => {
  db.query(
    "UPDATE Suppliers SET isActive = FALSE WHERE idSupplier = ?",
    [id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, res);
    }
  );
};

// Balance of one supplier (same definition as the list)
Supplier.getBalance = (id, result) => {
  db.query(balanceQuery(true), [id], (err, rows) => {
    if (err) return result(err, null);
    if (!rows.length) return result({ kind: "not_found" }, null);
    result(null, rows[0]);
  });
};

// Summary over all active suppliers, from the same balances as the list
Supplier.getSummaryStats = (result) => {
  db.query(balanceQuery(false), [], (err, rows) => {
    if (err) return result(err, null);
    const sum = (k) => rows.reduce((t, r) => t + parseFloat(r[k] || 0), 0);
    const totalPaid = sum("totalPayments") + sum("totalExpensePayments") + sum("totalCredits");
    const remaining = sum("currentDebt");
    result(null, {
      totalDebt: Math.round((remaining + totalPaid) * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      remaining: Math.round(remaining * 100) / 100
    });
  });
};

// Get supplier profile (debt, purchases, payments)
Supplier.getProfile = (id, result) => {
  // Get supplier info
  Supplier.findById(id, (err, supplier) => {
    if (err) {
      result(err, null);
      return;
    }

    // Total purchases (all received/partially_received)
    const purchasesQuery = `
      SELECT 
        COALESCE(SUM(totalAmount), 0) as totalPurchases,
        COUNT(*) as purchaseCount
      FROM Purchases
      WHERE supplierId = ? AND status IN ('received', 'partially_received')
    `;

    // Unpaid purchases = value of what we actually received (receivedQuantity * unitPrice per item), not full order total
    const unpaidQuery = `
      SELECT COALESCE(SUM(pi.receivedQuantity * pi.unitPrice), 0) as unpaidPurchases
      FROM Purchases p
      INNER JOIN PurchaseItems pi ON pi.purchaseId = p.idPurchase
      WHERE p.supplierId = ? AND (p.paymentType IS NULL OR p.paymentType = 'credit')
        AND p.status IN ('pending', 'received', 'partially_received')
    `;

    db.query(purchasesQuery, [id], (err, purchaseResult) => {
      if (err) {
        result(err, null);
        return;
      }

      const totalPurchases = parseFloat(purchaseResult[0]?.totalPurchases || 0);

      db.query(unpaidQuery, [id], (err, unpaidRows) => {
        if (err) {
          result(err, null);
          return;
        }
        const unpaidPurchases = parseFloat(unpaidRows[0]?.unpaidPurchases || 0);

        const expensesQuery = `
          SELECT 
            COALESCE(SUM(amount), 0) as totalPayments,
            COUNT(*) as paymentCount
          FROM Expenses
          WHERE supplierId = ?
        `;

        db.query(expensesQuery, [id], (err, expenseResult) => {
          if (err) {
            result(err, null);
            return;
          }

          const totalPayments = parseFloat(expenseResult[0]?.totalPayments || 0);
          const initialDebt = parseFloat(supplier.initialDebt || 0);

          // Get transfer totals (out = reduces debt, in = increases debt)
          const SupplierTransfer = require("./supplierTransfer.model");
          SupplierTransfer.getTotalOut(id, (errOut, transferOut) => {
            if (errOut) {
              result(errOut, null);
              return;
            }
            SupplierTransfer.getTotalIn(id, (errIn, transferIn) => {
              if (errIn) {
                result(errIn, null);
                return;
              }
              const out = parseFloat(transferOut || 0);
              const inAmt = parseFloat(transferIn || 0);
              const currentDebt = initialDebt + unpaidPurchases - totalPayments - out + inAmt;

              result(null, {
            supplier: supplier,
            initialDebt: initialDebt,
            totalPurchases: totalPurchases,
            purchaseCount: purchaseResult[0]?.purchaseCount || 0,
            unpaidPurchases: unpaidPurchases,
            totalPayments: totalPayments,
            paymentCount: expenseResult[0]?.paymentCount || 0,
            transferOut: out,
            transferIn: inAmt,
            currentDebt: currentDebt
          });
            });
          });
        });
      });
    });
  });
};

module.exports = Supplier;

