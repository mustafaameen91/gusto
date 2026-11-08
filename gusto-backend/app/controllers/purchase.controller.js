const Purchase = require("../models/purchase.model");
const Supplier = require("../models/supplier.model");
const SupplierPayment = require("../models/supplierPayment.model");

// Generate purchase number
exports.generateNumber = (req, res) => {
  Purchase.generatePurchaseNumber((err, purchaseNumber) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error generating purchase number."
      });
    }
    res.json({ purchaseNumber });
  });
};

// Create new purchase order — supplier is required (chosen from list); debt is tracked per supplier for credit purchases
exports.create = (req, res) => {
  if (!req.body.purchaseNumber || !req.body.purchaseDate) {
    return res.status(400).json({
      message: "Purchase number and purchase date are required!"
    });
  }

  if (!req.body.supplierId) {
    return res.status(400).json({
      message: "يجب اختيار المورد من القائمة."
    });
  }

  if (!req.body.items || req.body.items.length === 0) {
    return res.status(400).json({
      message: "At least one item is required!"
    });
  }

  const paymentType = req.body.paymentType === 'cash' ? 'cash' : 'credit';
  const supplierId = req.body.supplierId;

  Supplier.findById(supplierId, (err, supplier) => {
    if (err || !supplier) {
      return res.status(400).json({
        message: "المورد غير موجود."
      });
    }

    const purchase = {
      purchaseNumber: req.body.purchaseNumber,
      supplierId: supplierId,
      supplierName: supplier.supplierName || null,
      supplierPhone: supplier.supplierPhone || null,
      totalAmount: req.body.totalAmount || 0,
      purchaseDate: req.body.purchaseDate,
      expectedDeliveryDate: req.body.expectedDeliveryDate || null,
      status: 'pending',
      paymentType,
      createdBy: req.userId,
      notes: req.body.notes || null
    };

    Purchase.create(purchase, req.body.items, (err, data) => {
      if (err) {
        return res.status(500).json({
          message: err.message || "Error creating purchase order."
        });
      }

      if (paymentType === 'cash' && purchase.supplierId && data.idPurchase) {
        const payment = {
          supplierId: purchase.supplierId,
          amount: parseFloat(purchase.totalAmount) || 0,
          paymentDate: purchase.purchaseDate,
          paymentMethod: 'cash',
          recordedBy: req.userId,
          notes: `دفع مقابل أمر شراء ${purchase.purchaseNumber}` || null
        };
        SupplierPayment.create(payment, (payErr) => {
          if (payErr) console.error("Supplier payment (pay-now) error:", payErr);
        });
      }

      res.json(data);
    });
  });
};

// Get all purchases
exports.findAll = (req, res) => {
  const limit = req.query.limit;
  
  Purchase.getAll(limit, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving purchases."
      });
    }
    res.json(data);
  });
};

// Get single purchase
exports.findOne = (req, res) => {
  Purchase.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Purchase not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error retrieving purchase with id " + req.params.id
      });
    }
    res.json(data);
  });
};

// Receive purchase (confirm quantities and update inventory)
exports.receive = (req, res) => {
  console.log('📦 Receive purchase request received');
  console.log('  Purchase ID:', req.params.id);
  console.log('  User ID:', req.userId);
  console.log('  Items:', JSON.stringify(req.body.items, null, 2));
  
  if (!req.body.items || req.body.items.length === 0) {
    return res.status(400).json({
      message: "Received items are required!"
    });
  }

  // Validate that all items have receivedQuantity
  for (let item of req.body.items) {
    if (item.receivedQuantity === undefined || item.receivedQuantity === null) {
      console.error('❌ Item missing receivedQuantity:', item);
      return res.status(400).json({
        message: "All items must have receivedQuantity!"
      });
    }
  }

  Purchase.receive(req.params.id, req.body.items, req.userId, (err, data) => {
    if (err) {
      console.error('❌ Error receiving purchase:', err);
      return res.status(500).json({
        message: err.message || "Error receiving purchase."
      });
    }
    console.log('✅ Purchase received successfully:', data);
    res.json(data);
  });
};

// Update purchase
exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      message: "Content cannot be empty!"
    });
  }

  // First, check ownership and status
  Purchase.findById(req.params.id, (err, purchase) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Purchase not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error retrieving purchase."
      });
    }

    // Check ownership: Admin can edit any purchase, Purchases role can only edit their own
    if (req.userRole !== "admin" && purchase.createdBy !== req.userId) {
      return res.status(403).json({
        message: "You can only edit your own purchase orders!"
      });
    }

    // Only allow editing pending purchases
    if (purchase.status !== "pending") {
      return res.status(400).json({
        message: "You can only edit pending purchase orders!"
      });
    }

    const updateData = {};
    if (req.body.supplierName) updateData.supplierName = req.body.supplierName;
    if (req.body.supplierPhone !== undefined) updateData.supplierPhone = req.body.supplierPhone;
    if (req.body.totalAmount !== undefined) updateData.totalAmount = req.body.totalAmount;
    if (req.body.expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = req.body.expectedDeliveryDate;
    // Don't allow status change through update (it's managed by receiving process)
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;

    Purchase.updateById(req.params.id, updateData, (err, data) => {
      if (err) {
        if (err.kind === "not_found") {
          return res.status(404).json({
            message: `Purchase not found with id ${req.params.id}.`
          });
        }
        return res.status(500).json({
          message: "Error updating purchase with id " + req.params.id
        });
      }
      res.json(data);
    });
  });
};

// Delete purchase
exports.delete = (req, res) => {
  Purchase.remove(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Purchase not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Could not delete purchase with id " + req.params.id
      });
    }
    res.json({ message: "Purchase deleted successfully!" });
  });
};

