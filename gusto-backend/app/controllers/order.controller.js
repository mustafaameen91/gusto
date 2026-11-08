const Order = require("../models/order.model");
const MenuItem = require("../models/menuItem.model");
const Recipe = require("../models/recipe.model");
const Ingredient = require("../models/ingredient.model");
const InventoryTransaction = require("../models/inventoryTransaction.model");
const IngredientStock = require("../models/ingredientStock.model");
const KitchenItemStock = require("../models/kitchenItemStock.model");
const DailyReceipt = require("../models/dailyReceipt.model");
const Payment = require("../models/payment.model");
const { LOCATION_BARISTA_INTERNAL } = require("../services/transfer.service");

// ============================================================================
// AUTO-DEDUCTION LOGIC - CRITICAL FEATURE
// ============================================================================
const deductInventoryForOrder = (orderId, orderItems, callback) => {
  const transactions = [];
  let processedItems = 0;

  if (orderItems.length === 0) {
    callback(null, []);
    return;
  }

  orderItems.forEach((item) => {
    // Get menu item details
    MenuItem.getWithRecipes(item.menuItemId, (err, menuItem) => {
      if (err) {
        console.error(`Error getting menu item ${item.menuItemId}:`, err);
        processedItems++;
        if (processedItems === orderItems.length) {
          finalizeTransactions();
        }
        return;
      }

      // Kitchen item: decrease kitchen mini storage only (no ingredient deduction)
      if (menuItem.isKitchen) {
        KitchenItemStock.decrease(menuItem.idMenuItem, item.quantity, (errK) => {
          if (errK) console.error(`Kitchen stock decrease for ${menuItem.itemName}:`, errK.message);
          processedItems++;
          if (processedItems === orderItems.length) finalizeTransactions();
        });
        return;
      }

      // Barista (recipe) items: deduct ingredients from Barista Internal
      if (menuItem.itemType === 'recipe' && menuItem.recipes.length > 0) {
        // Filter recipes by sizeId if size was selected
        const relevantRecipes = item.sizeId 
          ? menuItem.recipes.filter(r => r.sizeId === item.sizeId)
          : menuItem.recipes.filter(r => !r.sizeId);
        const recipesToUse = relevantRecipes.length > 0 
          ? relevantRecipes 
          : menuItem.recipes.filter(r => !r.sizeId);
        
        recipesToUse.forEach((recipe) => {
          const quantityToDeduct = recipe.quantityNeeded * item.quantity;
          const sizeNote = item.sizeId ? ` (${item.sizeName || 'Size'})` : '';
          transactions.push({
            ingredientId: recipe.ingredientId,
            transactionType: 'usage',
            quantity: -quantityToDeduct,
            orderId: orderId,
            recordedBy: null,
            notes: `Auto-deduction for ${menuItem.itemName}${sizeNote} (Order #${orderId})`
          });
        });
      } else if (menuItem.itemType === 'harmony' && menuItem.isInventoryItem) {
        transactions.push({
          ingredientId: item.menuItemId,
          transactionType: 'usage',
          quantity: -item.quantity,
          orderId: orderId,
          recordedBy: null,
          notes: `Auto-deduction for harmony item ${menuItem.itemName} (Order #${orderId})`
        });
      }

      processedItems++;
      if (processedItems === orderItems.length) {
        finalizeTransactions();
      }
    });
  });

  function finalizeTransactions() {
    if (transactions.length === 0) {
      callback(null, []);
      return;
    }

    // Bulk insert transactions
    InventoryTransaction.bulkCreate(transactions, (err, result) => {
      if (err) {
        console.error("Error creating inventory transactions:", err);
        callback(err, null);
        return;
      }

      // Deduct from Barista Internal (IngredientStock), not Main
      updateBaristaInternalStocks(transactions, (err) => {
        if (err) {
          console.error("Error updating Barista Internal stocks:", err);
          callback(err, null);
          return;
        }
        callback(null, transactions);
      });
    });
  }

  function updateBaristaInternalStocks(transactions, callback) {
    if (transactions.length === 0) return callback(null);
    let updated = 0;
    transactions.forEach((transaction) => {
      IngredientStock.upsert(transaction.ingredientId, LOCATION_BARISTA_INTERNAL, transaction.quantity, (err) => {
        if (err) console.error(`Error updating Barista stock for ingredient ${transaction.ingredientId}:`, err);
        updated++;
        if (updated === transactions.length) callback(null);
      });
    });
  }
};

// ============================================================================
// VALIDATE KITCHEN STOCK (before creating order)
// ============================================================================
const validateKitchenStock = (orderItems, callback) => {
  const byId = {};
  orderItems.forEach((item) => {
    const id = item.menuItemId;
    const qty = Math.max(0, parseInt(item.quantity, 10) || 0);
    byId[id] = (byId[id] || 0) + qty;
  });
  const ids = Object.keys(byId).map(Number).filter(Boolean);
  if (ids.length === 0) return callback(null);

  let processed = 0;
  let validationError = null;

  function done() {
    processed++;
    if (processed < ids.length) return;
    callback(validationError);
  }

  ids.forEach((menuItemId) => {
    MenuItem.getWithRecipes(menuItemId, (err, menuItem) => {
      if (err) {
        validationError = err;
        done();
        return;
      }
      if (!menuItem || !menuItem.isKitchen) {
        done();
        return;
      }
      const requested = byId[menuItemId];
      KitchenItemStock.getByMenuItem(menuItemId, (errK, stock) => {
        if (errK) {
          validationError = errK;
          done();
          return;
        }
        const available = stock && stock.quantity != null ? Number(stock.quantity) : 0;
        if (requested > available) {
          validationError = new Error(
            `الكمية غير متوفرة لـ "${menuItem.itemName}" في مخزن المطبخ. المتوفر: ${available}، المطلوب: ${requested}.`
          );
        }
        done();
      });
    });
  });
};

// ============================================================================
// ORDER CRUD OPERATIONS
// ============================================================================

exports.create = (req, res) => {
  if (!req.body.orderItems || req.body.orderItems.length === 0) {
    return res.status(400).json({
      message: "Order must have at least one item!"
    });
  }

  const today = new Date().toISOString().split("T")[0];

  // Require an open shift for GL: link order to dailyReceiptId
  DailyReceipt.findByDate(today, (err, openShift) => {
    if (err && err.kind !== "not_found") {
      return res.status(500).json({ message: err.message || "Error checking shift." });
    }
    if (!openShift || openShift.isClosed) {
      return res.status(400).json({
        message: "يجب فتح الشفت أولاً قبل إنشاء الطلب.",
        code: "NO_OPEN_SHIFT"
      });
    }

    // Validate kitchen stock before creating order (prevent over-selling)
    validateKitchenStock(req.body.orderItems, (validateErr) => {
      if (validateErr) {
        return res.status(400).json({
          message: validateErr.message || "Insufficient kitchen stock.",
          code: "INSUFFICIENT_KITCHEN_STOCK"
        });
      }

    const orderNumber = `ORD-${Date.now()}`;

    let discountAmount = req.body.discount || 0;
    const discountType = req.body.discountType || "amount";
    const subtotal = req.body.subtotal || req.body.totalAmount;

    if (discountType === "percentage" && req.body.discount > 0) {
      discountAmount = (subtotal * req.body.discount) / 100;
    } else {
      discountAmount = Number(req.body.discount) || 0;
    }

    const saleType = req.body.saleType || "cash";
    if (saleType === "credit") {
      if (!req.body.customerId) {
        return res.status(400).json({
          message: "عند البيع آجل يجب اختيار العميل (المدين).",
          code: "CUSTOMER_REQUIRED_FOR_CREDIT"
        });
      }
    }

    const order = {
      orderNumber,
      orderType: req.body.orderType || "cashier",
      tableNumber: req.body.tableNumber || null,
      customerId: req.body.customerId || null,
      saleType,
      dailyReceiptId: openShift.idDailyReceipt,
      status: "pending",
      totalAmount: req.body.totalAmount,
      discount: discountAmount,
      discountType,
      cashierId: req.userId,
      notes: req.body.notes || null,
      customerName: req.body.customerName || null,
      customerPhone: req.body.customerPhone || null
    };

    Order.create(order, req.body.orderItems, (err, data) => {
      if (err) {
        return res.status(500).json({
          message: err.message || "Error creating order."
        });
      }

      const totalAmount = Number(req.body.totalAmount) || 0;
      const paymentMethod = req.body.orderType === "card" ? "card" : "cash";

      // Only create Payment for cash/card sales; for credit (آجل) the customer pays later
      if (saleType !== "credit") {
        const payment = {
          orderId: data.orderId,
          cashierId: req.userId,
          paymentMethod,
          amountReceived: totalAmount,
          changeDue: 0,
          receiptNumber: orderNumber,
          notes: req.body.notes || null
        };

        Payment.create(payment, (payErr) => {
          if (payErr) {
            console.error("Payment record error:", payErr);
          }
        });
      }

      deductInventoryForOrder(data.orderId, req.body.orderItems, (invErr, transactions) => {
        if (invErr) {
          console.error("Inventory deduction error:", invErr);
        } else {
          console.log(`✅ Inventory deducted for order ${data.orderId}: ${(transactions || []).length} transactions`);
        }

        const io = req.app.get("io");
        if (io) {
          io.to("kitchen").emit("new_order", {
            orderId: data.orderId,
            orderNumber,
            items: req.body.orderItems
          });
        }

        res.json(data);
      });
    });
    });
  });
};

exports.findAll = (req, res) => {
  const filters = {
    status: req.query.status,
    date: req.query.date,
    page: req.query.page,
    limit: req.query.limit
  };

  Order.getAll(filters, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving orders."
      });
    }
    res.json(data);
  });
};

exports.findOne = (req, res) => {
  Order.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Order not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error retrieving order with id " + req.params.id
      });
    }
    res.json(data);
  });
};

exports.getActive = (req, res) => {
  Order.getActive((err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving active orders."
      });
    }
    res.json(data);
  });
};

exports.updateStatus = (req, res) => {
  if (!req.body.status) {
    return res.status(400).json({
      message: "Status is required!"
    });
  }

  Order.updateStatus(req.params.id, req.body.status, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Order not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error updating order status"
      });
    }

    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.to('kitchen').emit('order_status_changed', {
        orderId: req.params.id,
        status: req.body.status
      });
      io.to('cashier').emit('order_status_changed', {
        orderId: req.params.id,
        status: req.body.status
      });
    }

    res.json({ message: "Order status updated successfully" });
  });
};

exports.recomputeStatus = (req, res) => {
  console.log(`[recomputeStatus] Manually recomputing status for order ${req.params.id}`);
  Order.recomputeStatus(req.params.id, (err, data) => {
    if (err) {
      console.error(`[recomputeStatus] Error for order ${req.params.id}:`, err);
      return res.status(500).json({
        message: err.message || "Error recomputing order status."
      });
    }
    console.log(`[recomputeStatus] Order ${req.params.id} status: ${data?.status}`);

    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.to('kitchen').emit('order_status_changed', {
        orderId: req.params.id,
        status: data?.status
      });
      io.to('barista').emit('order_status_changed', {
        orderId: req.params.id,
        status: data?.status
      });
    }

    res.json({ 
      message: "Order status recomputed successfully",
      status: data?.status
    });
  });
};

exports.getDailySummary = (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];

  Order.getDailySummary(date, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving daily summary."
      });
    }
    res.json(data);
  });
};

