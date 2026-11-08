const db = require("./db");

/**
 * Customer (عميل) - for credit sales (آجل). Debtors = customers who owe us.
 * Tables: Customers, Orders (customerId + saleType='credit'), CustomerReceipts, CustomerReceiptAllocations.
 */
const Customer = {};

Customer.getAll = (result) => {
  db.query(
    "SELECT * FROM Customers WHERE isActive = TRUE ORDER BY fullName",
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, res || []);
    }
  );
};

/**
 * List customers with balance (for list page).
 * Balance = initialDebt + sum(credit orders) - sum(all payments received) - returns refunded to the account.
 */
Customer.getAllWithBalance = (result) => {
  const query = `
    SELECT c.*,
           COALESCE(ord.totalOrders, 0) AS totalOrders,
           COALESCE(paid.totalPaid, 0) AS totalPaid,
           COALESCE(ref.totalRefunded, 0) AS totalRefunded,
           (COALESCE(c.initialDebt, 0) + COALESCE(ord.totalOrders, 0) - COALESCE(paid.totalPaid, 0) - COALESCE(ref.totalRefunded, 0)) AS balance
    FROM Customers c
    LEFT JOIN (
      SELECT customerId, SUM(totalAmount) AS totalOrders
      FROM Orders
      WHERE saleType = 'credit' AND status != 'cancelled'
      GROUP BY customerId
    ) ord ON ord.customerId = c.idCustomer
    LEFT JOIN (
      SELECT customerId, SUM(amount) AS totalPaid
      FROM CustomerReceipts
      GROUP BY customerId
    ) paid ON paid.customerId = c.idCustomer
    LEFT JOIN (
      SELECT customerId, SUM(totalRefundAmount) AS totalRefunded
      FROM OrderReturns
      WHERE refundMethod = 'credit'
      GROUP BY customerId
    ) ref ON ref.customerId = c.idCustomer
    WHERE c.isActive = TRUE
    ORDER BY c.fullName
  `;
  db.query(query, [], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res || []);
  });
};

Customer.findById = (id, result) => {
  db.query("SELECT * FROM Customers WHERE idCustomer = ?", [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (!res || res.length === 0) {
      result({ kind: "not_found" }, null);
      return;
    }
    result(null, res[0]);
  });
};

Customer.create = (customer, result) => {
  db.query("INSERT INTO Customers SET ?", customer, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, { idCustomer: res.insertId, ...customer });
  });
};

Customer.updateById = (id, customer, result) => {
  db.query(
    "UPDATE Customers SET ? WHERE idCustomer = ?",
    [customer, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows === 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, { idCustomer: id, ...customer });
    }
  );
};

/**
 * Profile: customer info + balance (receivable = ما يستحق علينا من العميل).
 * Balance = initialDebt + sum(credit order totals) - sum(all payments received).
 */
Customer.getProfile = (id, result) => {
  Customer.findById(id, (err, customer) => {
    if (err) {
      result(err, null);
      return;
    }

    const customerId = id;

    // Total from credit orders (what customer owes us)
    db.query(
      `SELECT COALESCE(SUM(o.totalAmount), 0) AS totalOrders,
              COUNT(*) AS orderCount
       FROM Orders o
       WHERE o.customerId = ? AND o.saleType = 'credit' AND o.status != 'cancelled'`,
      [customerId],
      (errOrders, orderRows) => {
        if (errOrders) {
          result(errOrders, null);
          return;
        }

        const totalOrders = parseFloat(orderRows[0]?.totalOrders || 0);
        const orderCount = parseInt(orderRows[0]?.orderCount || 0, 10);

        // Total paid by the customer (every receipt, allocated to orders or not) and returns refunded to the account
        db.query(
          `SELECT COALESCE(SUM(amount), 0) AS totalPaid,
                  (SELECT COALESCE(SUM(totalRefundAmount), 0) FROM OrderReturns WHERE customerId = ? AND refundMethod = 'credit') AS totalRefunded
           FROM CustomerReceipts
           WHERE customerId = ?`,
          [customerId, customerId],
          (errAlloc, allocRows) => {
            if (errAlloc) {
              result(errAlloc, null);
              return;
            }

            const totalPaid = parseFloat(allocRows[0]?.totalPaid || 0);
            const initialDebt = parseFloat(customer.initialDebt || 0);
            const totalRefunded = parseFloat(allocRows[0]?.totalRefunded || 0);
            const balance = initialDebt + totalOrders - totalPaid - totalRefunded;

            result(null, {
              customer,
              initialDebt,
              totalOrders,
              orderCount,
              totalPaid,
              totalRefunded,
              balance
            });
          }
        );
      }
    );
  });
};

/**
 * Credit orders for this customer (for profile list).
 */
Customer.getCreditOrders = (customerId, result) => {
  db.query(
    `SELECT o.idOrder, o.orderNumber, o.orderDate, o.totalAmount, o.discount, o.status,
            (o.totalAmount) AS netAmount
     FROM Orders o
     WHERE o.customerId = ? AND o.saleType = 'credit' AND o.status != 'cancelled'
     ORDER BY o.orderDate DESC`,
    [customerId],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, rows || []);
    }
  );
};

/**
 * Receipts (مدفوعات العميل) for this customer.
 */
Customer.getReceipts = (customerId, result) => {
  db.query(
    `SELECT cr.*, s.fullName AS recordedByName
     FROM CustomerReceipts cr
     LEFT JOIN Staff s ON s.idStaff = cr.recordedBy
     WHERE cr.customerId = ?
     ORDER BY cr.receiptDate DESC`,
    [customerId],
    (err, rows) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, rows || []);
    }
  );
};

/**
 * Outstanding balance for one customer (uses the given connection so it can run inside a transaction).
 */
const outstandingBalance = (conn, customerId, cb) => {
  conn.query(
    `SELECT COALESCE(c.initialDebt, 0)
            + COALESCE((SELECT SUM(totalAmount) FROM Orders WHERE customerId = c.idCustomer AND saleType = 'credit' AND status != 'cancelled'), 0)
            - COALESCE((SELECT SUM(amount) FROM CustomerReceipts WHERE customerId = c.idCustomer), 0)
            - COALESCE((SELECT SUM(totalRefundAmount) FROM OrderReturns WHERE customerId = c.idCustomer AND refundMethod = 'credit'), 0) AS balance
     FROM Customers c WHERE c.idCustomer = ?`,
    [customerId],
    (err, rows) => cb(err, rows && rows[0] ? Number(rows[0].balance) : null)
  );
};
Customer.outstandingBalance = (customerId, cb) => outstandingBalance(db, customerId, cb);

/**
 * Create a customer receipt (استلام مبلغ من العميل).
 * receiptData: { customerId, receiptDate, amount, paymentMethod, recordedBy, notes?, allocations?: [{ orderId, amountApplied }] }
 *
 * In one transaction:
 *  - refuses amounts above what the customer owes
 *  - attaches cash receipts to the open shift (adds to the drawer's expected cash)
 *  - allocates to the given orders (validated) or to the oldest unpaid credit orders
 *  - posts the journal entry: Dr cash (cash) or bank (other methods), Cr receivables
 * Errors with .status are user errors (400).
 */
Customer.createReceipt = (receiptData, result) => {
  const userError = (msg) => Object.assign(new Error(msg), { status: 400 });
  db.getConnection((errConn, conn) => {
    if (errConn) return result(errConn, null);
    const fail = (e) => conn.rollback(() => { conn.release(); result(e, null); });
    conn.beginTransaction((errTx) => {
      if (errTx) { conn.release(); return result(errTx, null); }

      // Lock the customer so two payments can't both pass the balance check
      conn.query("SELECT idCustomer, fullName FROM Customers WHERE idCustomer = ? FOR UPDATE", [receiptData.customerId], (e1, custRows) => {
        if (e1) return fail(e1);
        if (!custRows.length) return fail(Object.assign(new Error("Customer not found"), { status: 404 }));
        const customerName = custRows[0].fullName;

        outstandingBalance(conn, receiptData.customerId, (e2, balance) => {
          if (e2) return fail(e2);
          const amount = Math.round(Number(receiptData.amount) * 100) / 100;
          if (amount > balance + 0.005) {
            return fail(userError(`المبلغ أكبر من الرصيد المستحق على العميل (${balance.toLocaleString()} د.ع)`));
          }

          conn.query(
            `SELECT ps.cashAccountId, ps.bankAccountId, ps.arAccountId,
                    (SELECT idDailyReceipt FROM DailyReceipts WHERE isClosed = 0 ORDER BY idDailyReceipt DESC LIMIT 1) AS openShiftId
             FROM PostingSettings ps WHERE ps.name = 'default' LIMIT 1`,
            (e3, psRows) => {
              if (e3) return fail(e3);
              const ps = psRows[0];
              if (!ps) return fail(new Error("PostingSettings 'default' missing"));
              const method = receiptData.paymentMethod || "cash";
              const receipt = {
                customerId: receiptData.customerId,
                receiptDate: receiptData.receiptDate,
                amount,
                paymentMethod: method,
                dailyReceiptId: method === "cash" ? ps.openShiftId || null : null,
                recordedBy: receiptData.recordedBy,
                notes: receiptData.notes || null,
              };

              conn.query("INSERT INTO CustomerReceipts SET ?", receipt, (e4, ins) => {
                if (e4) return fail(e4);
                const idCustomerReceipt = ins.insertId;

                // Unpaid amount per credit order (oldest first)
                conn.query(
                  `SELECT o.idOrder, o.totalAmount - COALESCE(SUM(a.amountApplied), 0) AS unpaid
                   FROM Orders o
                   LEFT JOIN CustomerReceiptAllocations a ON a.orderId = o.idOrder
                   WHERE o.customerId = ? AND o.saleType = 'credit' AND o.status != 'cancelled'
                   GROUP BY o.idOrder, o.totalAmount, o.orderDate
                   HAVING unpaid > 0
                   ORDER BY o.orderDate, o.idOrder`,
                  [receiptData.customerId],
                  (e5, openOrders) => {
                    if (e5) return fail(e5);
                    const unpaidById = new Map(openOrders.map((o) => [o.idOrder, Number(o.unpaid)]));
                    let allocations = [];
                    const requested = receiptData.allocations || [];

                    if (requested.length) {
                      let sum = 0;
                      for (const a of requested) {
                        const orderId = Number(a.orderId);
                        const applied = Math.round(Number(a.amountApplied) * 100) / 100;
                        if (!(applied > 0)) return fail(userError("مبلغ التخصيص يجب أن يكون أكبر من صفر"));
                        if (!unpaidById.has(orderId)) return fail(userError(`الطلب ${orderId} ليس طلباً آجلاً غير مسدد لهذا العميل`));
                        if (applied > unpaidById.get(orderId) + 0.005) return fail(userError(`المبلغ المخصص للطلب ${orderId} أكبر من المتبقي عليه`));
                        sum += applied;
                        allocations.push({ orderId, amountApplied: applied });
                      }
                      if (sum > amount + 0.005) return fail(userError("مجموع التخصيصات أكبر من مبلغ الدفعة"));
                    } else {
                      // Pay off the oldest unpaid orders first
                      let left = amount;
                      for (const o of openOrders) {
                        if (left <= 0) break;
                        const applied = Math.min(left, Number(o.unpaid));
                        allocations.push({ orderId: o.idOrder, amountApplied: Math.round(applied * 100) / 100 });
                        left -= applied;
                      }
                    }

                    const afterAllocations = (next) => {
                      if (!allocations.length) return next();
                      conn.query(
                        "INSERT INTO CustomerReceiptAllocations (customerReceiptId, orderId, amountApplied) VALUES ?",
                        [allocations.map((a) => [idCustomerReceipt, a.orderId, a.amountApplied])],
                        (e6) => (e6 ? fail(e6) : next())
                      );
                    };

                    afterAllocations(() => {
                      const debitAccount = method === "cash" ? ps.cashAccountId : ps.bankAccountId || ps.cashAccountId;
                      const memo = `تحصيل من العميل ${customerName}`;
                      conn.query(
                        `INSERT INTO JournalEntries (entryDate, sourceType, sourceId, status, memo, createdBy, postedBy, postedAt)
                         VALUES (NOW(), 'CUSTOMER_RECEIPT', ?, 'POSTED', ?, ?, ?, NOW())`,
                        [idCustomerReceipt, memo, receiptData.recordedBy, receiptData.recordedBy],
                        (e7, je) => {
                          if (e7) return fail(e7);
                          conn.query(
                            "INSERT INTO JournalLines (journalEntryId, accountId, debit, credit, lineMemo) VALUES ?",
                            [[[je.insertId, debitAccount, amount, 0, memo], [je.insertId, ps.arAccountId, 0, amount, memo]]],
                            (e8) => {
                              if (e8) return fail(e8);
                              conn.commit((e9) => {
                                if (e9) return fail(e9);
                                conn.release();
                                result(null, { idCustomerReceipt, ...receipt, allocations, journalEntryId: je.insertId, balanceAfter: Math.round((balance - amount) * 100) / 100 });
                              });
                            }
                          );
                        }
                      );
                    });
                  }
                );
              });
            }
          );
        });
      });
    });
  });
};

module.exports = Customer;
