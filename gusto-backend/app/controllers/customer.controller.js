const Customer = require("../models/customer.model");

exports.getAll = (req, res) => {
  const withBalance = req.query.withBalance === "1" || req.query.withBalance === "true";
  const method = withBalance ? Customer.getAllWithBalance : Customer.getAll;
  method((err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving customers."
      });
    }
    res.json(data);
  });
};

exports.findById = (req, res) => {
  Customer.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({ message: "Customer not found." });
      }
      return res.status(500).json({
        message: err.message || "Error retrieving customer."
      });
    }
    res.json(data);
  });
};

exports.getProfile = (req, res) => {
  Customer.getProfile(req.params.id, (err, profile) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({ message: "Customer not found." });
      }
      return res.status(500).json({
        message: err.message || "Error retrieving customer profile."
      });
    }

    Customer.getCreditOrders(req.params.id, (errOrders, orders) => {
      if (errOrders) {
        return res.status(500).json({
          message: errOrders.message || "Error retrieving orders."
        });
      }
      Customer.getReceipts(req.params.id, (errReceipts, receipts) => {
        if (errReceipts) {
          return res.status(500).json({
            message: errReceipts.message || "Error retrieving receipts."
          });
        }
        res.json({
          ...profile,
          orders: orders || [],
          receipts: receipts || []
        });
      });
    });
  });
};

exports.create = (req, res) => {
  if (!req.body.fullName || !req.body.fullName.trim()) {
    return res.status(400).json({
      message: "Customer name (fullName) is required."
    });
  }

  const customer = {
    fullName: req.body.fullName.trim(),
    phone: req.body.phone || null,
    creditLimit: req.body.creditLimit != null ? parseFloat(req.body.creditLimit) : 0,
    dueDays: req.body.dueDays != null ? parseInt(req.body.dueDays, 10) : 0,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    notes: req.body.notes || null
  };

  Customer.create(customer, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error creating customer."
      });
    }
    res.status(201).json(data);
  });
};

exports.update = (req, res) => {
  if (!req.body.fullName || !req.body.fullName.trim()) {
    return res.status(400).json({
      message: "Customer name (fullName) is required."
    });
  }

  const customer = {
    fullName: req.body.fullName.trim(),
    phone: req.body.phone !== undefined ? req.body.phone : undefined,
    creditLimit: req.body.creditLimit !== undefined ? parseFloat(req.body.creditLimit) : undefined,
    dueDays: req.body.dueDays !== undefined ? parseInt(req.body.dueDays, 10) : undefined,
    isActive: req.body.isActive !== undefined ? req.body.isActive : undefined,
    notes: req.body.notes !== undefined ? req.body.notes : undefined
  };

  const filtered = {};
  Object.keys(customer).forEach((k) => {
    if (customer[k] !== undefined) filtered[k] = customer[k];
  });

  if (Object.keys(filtered).length === 0) {
    return res.status(400).json({ message: "No fields to update." });
  }

  Customer.updateById(req.params.id, filtered, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({ message: "Customer not found." });
      }
      return res.status(500).json({
        message: err.message || "Error updating customer."
      });
    }
    res.json(data);
  });
};

/**
 * Create a customer receipt (تسديد / استلام مبلغ من العميل).
 * Body: { amount (required), receiptDate?, paymentMethod?, notes?, allocations?: [{ orderId, amountApplied }] }
 */
exports.createReceipt = (req, res) => {
  const customerId = parseInt(req.params.id, 10);
  if (isNaN(customerId)) {
    return res.status(400).json({ message: "Invalid customer id." });
  }

  const amount = parseFloat(req.body.amount);
  if (amount == null || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      message: "Amount is required and must be a positive number."
    });
  }

  const receiptData = {
    customerId,
    receiptDate: req.body.receiptDate || new Date().toISOString().slice(0, 10),
    amount,
    paymentMethod: req.body.paymentMethod || "cash",
    recordedBy: req.userId || null,
    notes: req.body.notes || null,
    allocations: Array.isArray(req.body.allocations) ? req.body.allocations : []
  };

  Customer.createReceipt(receiptData, (err, data) => {
    if (err) {
      return res.status(err.status || 500).json({
        message: err.message || "Error creating customer receipt."
      });
    }
    res.status(201).json(data);
  });
};
