const Order = require("../models/order.model");
const { todayBusinessDate, businessWindow } = require("../services/businessDay");
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

      const finishItem = () => {
        processedItems++;
        if (processedItems === orderItems.length) finalizeTransactions();
      };

      // Recipe items (food and drinks): use their ingredients from the kitchen internal store
      // and record the cost, so shift close can post cost of goods sold.
      if (menuItem.itemType === 'recipe' && menuItem.recipes.length > 0) {
        // The Cashier sends itemSizeId; use the size's own recipe when there is one
        const sizeId = Number(item.itemSizeId ?? item.sizeId) || null;
        const relevantRecipes = sizeId
          ? menuItem.recipes.filter(r => Number(r.sizeId) === sizeId)
          : menuItem.recipes.filter(r => !r.sizeId);
        const recipesToUse = relevantRecipes.length > 0 
          ? relevantRecipes 
          : menuItem.recipes.filter(r => !r.sizeId);
        
        recipesToUse.forEach((recipe) => {
          const quantityToDeduct = recipe.quantityNeeded * item.quantity;
          const unitCost = Number(recipe.costPerUnit) || 0;
          const sizeNote = sizeId ? ` (${item.sizeName || 'Size'})` : '';
          transactions.push({
            ingredientId: recipe.ingredientId,
            transactionType: 'usage',
            quantity: -quantityToDeduct,
            costPerUnit: unitCost,
            totalCost: Math.round(quantityToDeduct * unitCost * 100) / 100,
            orderId: orderId,
            recordedBy: null,
            notes: `Auto-deduction for ${menuItem.itemName}${sizeNote} (Order #${orderId})`
          });
        });
      }
      // Harmony items have no ingredient link; their stock is managed by hand.
      // (The old code deducted ingredient #menuItemId, i.e. an unrelated ingredient.)

      // Food: also count down the ready portions
      if (menuItem.isKitchen) {
        KitchenItemStock.decrease(menuItem.idMenuItem, item.quantity, (errK) => {
          if (errK) console.error(`Kitchen stock decrease for ${menuItem.itemName}:`, errK.message);
          finishItem();
        });
        return;
      }
      finishItem();
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

const ORDER_TYPES = ["cashier", "card", "qr"];
const SALE_TYPES = ["cash", "credit"];
const DISCOUNT_ROLES = ["admin", "supervisor"];
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Validate an order and price it from the menu.
 * Item price = MenuItems.basePrice + ItemSizes.priceAdjustment (when a size is chosen).
 * Returns { items, subtotal, discount, discountType, total } or { error, status, code }.
 */
const priceOrder = (body, role) =>
  new Promise((resolve) => {
    const db = require("../models/db");
    const orderType = body.orderType || "cashier";
    const saleType = body.saleType || "cash";
    if (!ORDER_TYPES.includes(orderType)) return resolve({ error: "طريقة دفع غير صحيحة" });
    if (!SALE_TYPES.includes(saleType)) return resolve({ error: "نوع البيع غير صحيح" });

    const items = body.orderItems || [];
    for (const it of items) {
      const q = Number(it.quantity);
      if (!Number.isInteger(q) || q < 1) return resolve({ error: "الكمية يجب أن تكون عدداً صحيحاً أكبر من صفر" });
    }
    const menuIds = [...new Set(items.map((it) => Number(it.menuItemId)))];
    const sizeIds = [...new Set(items.map((it) => Number(it.itemSizeId ?? it.sizeId)).filter(Boolean))];

    db.query("SELECT idMenuItem, itemName, basePrice, isActive, isAvailable FROM MenuItems WHERE idMenuItem IN (?)", [menuIds], (err, menuRows) => {
      if (err) return resolve({ error: err.message, status: 500 });
      const menu = new Map(menuRows.map((m) => [m.idMenuItem, m]));
      const loadSizes = (cb) => (sizeIds.length
        ? db.query("SELECT idItemSize, menuItemId, sizeName, priceAdjustment, isActive FROM ItemSizes WHERE idItemSize IN (?)", [sizeIds], cb)
        : cb(null, []));
      loadSizes((errS, sizeRows) => {
        if (errS) return resolve({ error: errS.message, status: 500 });
        const sizes = new Map(sizeRows.map((z) => [z.idItemSize, z]));
        let subtotal = 0;
        const pricedItems = [];
        for (const it of items) {
          const m = menu.get(Number(it.menuItemId));
          if (!m || !m.isActive) return resolve({ error: `الصنف ${it.menuItemId} غير موجود` });
          if (!m.isAvailable) return resolve({ error: `الصنف "${m.itemName}" غير متاح حالياً` });
          const sizeId = Number(it.itemSizeId ?? it.sizeId) || null;
          let price = Number(m.basePrice);
          let sizeName = null;
          if (sizeId) {
            const z = sizes.get(sizeId);
            if (!z || z.menuItemId !== m.idMenuItem || !z.isActive) return resolve({ error: `الحجم المختار غير صالح للصنف "${m.itemName}"` });
            price += Number(z.priceAdjustment);
            sizeName = z.sizeName;
          }
          const quantity = Number(it.quantity);
          subtotal += price * quantity;
          pricedItems.push({ ...it, menuItemId: m.idMenuItem, quantity, price: round2(price), itemSizeId: sizeId, sizeName });
        }
        subtotal = round2(subtotal);

        const discountType = body.discountType === "percentage" ? "percentage" : "amount";
        const discount = Number(body.discount) || 0;
        if (discount < 0) return resolve({ error: "الخصم لا يمكن أن يكون سالباً" });
        if (discount > 0 && !DISCOUNT_ROLES.includes(role)) {
          return resolve({ error: "الخصم مسموح للمشرف أو المدير فقط", status: 403, code: "DISCOUNT_NOT_ALLOWED" });
        }
        if (discountType === "percentage" && discount > 100) return resolve({ error: "نسبة الخصم لا يمكن أن تتجاوز 100%" });
        const discountAmount = round2(discountType === "percentage" ? (subtotal * discount) / 100 : discount);
        if (discountAmount > subtotal) return resolve({ error: "الخصم أكبر من قيمة الطلب" });

        resolve({ items: pricedItems, subtotal, discount, discountType, total: round2(subtotal - discountAmount) });
      });
    });
  });

// Credit limit 0 means "no limit". Returns an Arabic message when the sale would exceed it.
const creditLimitProblem = (customerId, orderTotal) =>
  new Promise((resolve) => {
    const Customer = require("../models/customer.model");
    Customer.findById(customerId, (err, customer) => {
      if (err || !customer) return resolve("العميل غير موجود");
      if (!customer.isActive) return resolve("حساب العميل غير فعّال");
      const limit = Number(customer.creditLimit || 0);
      if (limit <= 0) return resolve(null);
      Customer.outstandingBalance(customerId, (errBal, balance) => {
        if (errBal) return resolve("تعذر التحقق من رصيد العميل");
        if (balance + orderTotal > limit + 0.005) {
          return resolve(`تجاوز حد الائتمان للعميل: الرصيد الحالي ${balance.toLocaleString()} + الطلب ${orderTotal.toLocaleString()} > الحد ${limit.toLocaleString()} د.ع`);
        }
        resolve(null);
      });
    });
  });

exports.create = async (req, res) => {
  if (!req.body.orderItems || req.body.orderItems.length === 0) {
    return res.status(400).json({
      message: "Order must have at least one item!"
    });
  }

  // Prices, subtotal, discount and total are computed here; the screen's numbers are not trusted
  const priced = await priceOrder(req.body, req.userRole);
  if (priced.error) {
    return res.status(priced.status || 400).json({ message: priced.error, code: priced.code || "INVALID_ORDER" });
  }
  req.body.orderItems = priced.items;
  req.body.subtotal = priced.subtotal;
  req.body.totalAmount = priced.total;
  req.body.discount = priced.discount;
  req.body.discountType = priced.discountType;

  const today = todayBusinessDate();

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
    validateKitchenStock(req.body.orderItems, async (validateErr) => {
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
      const limitMessage = await creditLimitProblem(req.body.customerId, Number(req.body.totalAmount) || 0);
      if (limitMessage) {
        return res.status(400).json({ message: limitMessage, code: "CREDIT_LIMIT_EXCEEDED" });
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

  // Cancelling the whole order changes money and stock: guarded transaction
  if (req.body.status === "cancelled") {
    const { cancelOrderItems } = require("../services/cancelOrderItems.service");
    return cancelOrderItems(req.params.id, null, { id: req.userId, role: req.userRole }, (errC, result) => {
      if (errC) return res.status(errC.status || 500).json({ message: errC.message });
      const io = req.app.get("io");
      if (io) {
        io.to("kitchen").emit("order_status_changed", { orderId: req.params.id, status: "cancelled" });
        io.to("cashier").emit("order_status_changed", { orderId: req.params.id, status: "cancelled" });
      }
      res.json({ message: "تم إلغاء الطلب", ...result });
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
  const date = req.query.date || todayBusinessDate();

  Order.getDailySummary(date, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving daily summary."
      });
    }
    res.json(data);
  });
};

