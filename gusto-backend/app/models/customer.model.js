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
 * List customers with balance (for list page). Balance = sum(credit orders) - sum(allocated payments).
 */
Customer.getAllWithBalance = (result) => {
  const query = `
    SELECT c.*,
           COALESCE(ord.totalOrders, 0) AS totalOrders,
           COALESCE(alloc.totalPaid, 0) AS totalPaid,
           (COALESCE(ord.totalOrders, 0) - COALESCE(alloc.totalPaid, 0)) AS balance
    FROM Customers c
    LEFT JOIN (
      SELECT customerId, SUM(totalAmount) AS totalOrders
      FROM Orders
      WHERE saleType = 'credit' AND status != 'cancelled'
      GROUP BY customerId
    ) ord ON ord.customerId = c.idCustomer
    LEFT JOIN (
      SELECT cr.customerId, SUM(cra.amountApplied) AS totalPaid
      FROM CustomerReceiptAllocations cra
      INNER JOIN CustomerReceipts cr ON cr.idCustomerReceipt = cra.customerReceiptId
      GROUP BY cr.customerId
    ) alloc ON alloc.customerId = c.idCustomer
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
 * Balance = sum(credit order totals) - sum(allocated payments).
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

        // Total allocated payments (what customer has paid against orders)
        db.query(
          `SELECT COALESCE(SUM(cra.amountApplied), 0) AS totalPaid
           FROM CustomerReceiptAllocations cra
           INNER JOIN CustomerReceipts cr ON cr.idCustomerReceipt = cra.customerReceiptId
           WHERE cr.customerId = ?`,
          [customerId],
          (errAlloc, allocRows) => {
            if (errAlloc) {
              result(errAlloc, null);
              return;
            }

            const totalPaid = parseFloat(allocRows[0]?.totalPaid || 0);
            const balance = totalOrders - totalPaid;

            result(null, {
              customer,
              totalOrders,
              orderCount,
              totalPaid,
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
 * Create a customer receipt (استلام مبلغ من العميل) and optional allocations to orders.
 * receiptData: { customerId, receiptDate, amount, paymentMethod, dailyReceiptId?, recordedBy, notes?, allocations?: [{ orderId, amountApplied }] }
 */
Customer.createReceipt = (receiptData, result) => {
  const receipt = {
    customerId: receiptData.customerId,
    receiptDate: receiptData.receiptDate,
    amount: receiptData.amount,
    paymentMethod: receiptData.paymentMethod || "cash",
    dailyReceiptId: receiptData.dailyReceiptId || null,
    recordedBy: receiptData.recordedBy,
    notes: receiptData.notes || null
  };

  db.query("INSERT INTO CustomerReceipts SET ?", receipt, (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    const idCustomerReceipt = res.insertId;
    const allocations = receiptData.allocations || [];

    if (allocations.length === 0) {
      result(null, { idCustomerReceipt, ...receipt, allocations: [] });
      return;
    }

    const values = allocations.map((a) => [idCustomerReceipt, a.orderId, a.amountApplied]);
    db.query(
      "INSERT INTO CustomerReceiptAllocations (customerReceiptId, orderId, amountApplied) VALUES ?",
      [values],
      (errAlloc) => {
        if (errAlloc) {
          result(errAlloc, null);
          return;
        }
        result(null, { idCustomerReceipt, ...receipt, allocations });
      }
    );
  });
};

module.exports = Customer;
