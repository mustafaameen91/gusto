const db = require("../models/db");
const Expense = require("../models/expense.model");
const Purchase = require("../models/purchase.model");
const Order = require("../models/order.model");
const InventoryTransaction = require("../models/inventoryTransaction.model");
const { profitForPeriod } = require("../services/profit.service");

// Helper function to get cafe day range (7 AM to 2:59 AM next day)
const getCafeDayRange = (date) => {
  const selectedDate = new Date(date + 'T00:00:00');
  const startDate = new Date(selectedDate);
  startDate.setHours(7, 0, 0, 0);
  
  const endDate = new Date(selectedDate);
  endDate.setDate(endDate.getDate() + 1);
  endDate.setHours(2, 59, 59, 999);
  
  const formatDateForMySQL = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  
  return {
    startDateTime: formatDateForMySQL(startDate),
    endDateTime: formatDateForMySQL(endDate)
  };
};

// Financial Report (Profit & Loss)
// paymentMethod filter: 'all' | 'cash' | 'card'. Orders: orderType 'cashier' = cash, 'card' = credit card
exports.getFinancial = (req, res) => {
  const startDate = req.query.startDate || new Date().toISOString().split('T')[0];
  const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  const paymentMethod = (req.query.paymentMethod || 'all').toLowerCase();

  const paymentFilter = paymentMethod === 'cash' ? " AND orderType = 'cashier'" : paymentMethod === 'card' ? " AND orderType = 'card'" : '';
  profitForPeriod(startDate, endDate, (errProfit, pf) => {
    if (errProfit) return res.status(500).json({ message: errProfit.message });

  // Use cafe day logic for single day, calendar day for ranges
  let salesQuery, salesParams;
  if (startDate === endDate) {
    const cafeDay = getCafeDayRange(startDate);
    salesQuery = `
      SELECT 
        COALESCE(SUM(totalAmount), 0) as totalSales,
        COUNT(*) as orderCount
      FROM Orders
      WHERE orderDate >= ? AND orderDate <= ?
        AND status != 'cancelled'${paymentFilter}
    `;
    salesParams = [cafeDay.startDateTime, cafeDay.endDateTime];
  } else {
    salesQuery = `
      SELECT 
        COALESCE(SUM(totalAmount), 0) as totalSales,
        COUNT(*) as orderCount
      FROM Orders
      WHERE DATE(orderDate) >= ? AND DATE(orderDate) <= ?
        AND status != 'cancelled'${paymentFilter}
    `;
    salesParams = [startDate, endDate];
  }

  // Totals by payment type (always for the period, no payment filter)
  let byPaymentQuery, byPaymentParams;
  if (startDate === endDate) {
    const cafeDay = getCafeDayRange(startDate);
    byPaymentQuery = `
      SELECT 
        COALESCE(orderType, 'cashier') as orderType,
        COALESCE(SUM(totalAmount), 0) as total,
        COUNT(*) as orderCount
      FROM Orders
      WHERE orderDate >= ? AND orderDate <= ?
        AND status != 'cancelled'
      GROUP BY orderType
    `;
    byPaymentParams = [cafeDay.startDateTime, cafeDay.endDateTime];
  } else {
    byPaymentQuery = `
      SELECT 
        COALESCE(orderType, 'cashier') as orderType,
        COALESCE(SUM(totalAmount), 0) as total,
        COUNT(*) as orderCount
      FROM Orders
      WHERE DATE(orderDate) >= ? AND DATE(orderDate) <= ?
        AND status != 'cancelled'
      GROUP BY orderType
    `;
    byPaymentParams = [startDate, endDate];
  }

  // Get expenses
  Expense.getTotal(startDate, endDate, (err, expenseTotal) => {
    const totalExpenses = parseFloat(expenseTotal?.totalExpenses || 0);
    
    // Get purchases
    const purchaseQuery = `
      SELECT COALESCE(SUM(totalAmount), 0) as totalPurchases
      FROM Purchases
      WHERE DATE(purchaseDate) >= ? AND DATE(purchaseDate) <= ?
        AND status IN ('received', 'partially_received')
    `;
    
    db.query(byPaymentQuery, byPaymentParams, (err, byPaymentRows) => {
      if (err) {
        return res.status(500).json({
          message: err.message || "Error retrieving payment breakdown."
        });
      }
      let totalCash = 0, totalCard = 0;
      (byPaymentRows || []).forEach(row => {
        const total = parseFloat(row.total || 0);
        if (row.orderType === 'card') totalCard = total;
        else totalCash += total; // 'cashier' or any other
      });

      db.query(salesQuery, salesParams, (err, salesResult) => {
        if (err) {
          return res.status(500).json({
            message: err.message || "Error retrieving financial report."
          });
        }

        const totalSales = parseFloat(salesResult[0]?.totalSales || 0);
        const orderCount = parseInt(salesResult[0]?.orderCount || 0);

        db.query(purchaseQuery, [startDate, endDate], (err, purchaseResult) => {
        if (err) {
          return res.status(500).json({
            message: err.message || "Error retrieving purchase data."
          });
        }
        
        const totalPurchases = parseFloat(purchaseResult[0]?.totalPurchases || 0);
        // Profit uses the shared definition (net sales − cost of goods − operating expenses + other income)
        
        const baseResponse = {
          period: { startDate: startDate, endDate: endDate },
          income: {
            totalSales: totalSales,
            orderCount: orderCount,
            totalCash: totalCash,
            totalCard: totalCard
          },
          expenses: { totalExpenses: totalExpenses, expenseCount: expenseTotal?.expenseCount || 0 },
          purchases: { totalPurchases: totalPurchases },
          profit: {
            netSales: pf.netSales,
            refunds: pf.refunds,
            cogs: pf.cogs,
            grossProfit: pf.grossProfit,
            operatingExpenses: pf.operatingExpenses,
            otherIncome: pf.otherIncome,
            netProfit: pf.netProfit,
            profitMargin: pf.profitMargin
          }
        };
        
        // Fetch expense details (every expense in date range)
        Expense.getAll({ startDate: startDate, endDate: endDate }, (err, expenseList) => {
          const expenseDetails = err ? [] : (expenseList || []).map(e => ({
            idExpense: e.idExpense,
            expenseDate: e.expenseDate,
            category: e.category,
            amount: parseFloat(e.amount || 0),
            description: e.description || '',
            receiptNumber: e.receiptNumber || '',
            recordedByName: e.recordedByName || ''
          }));
          
          // Fetch item sales details (every item sold in date range)
          let itemSalesQuery, itemSalesParams;
          if (startDate === endDate) {
            const cafeDay = getCafeDayRange(startDate);
            itemSalesQuery = `
              SELECT
                mi.itemName,
                c.categoryName,
                COALESCE(SUM(oi.quantity), 0) as totalQuantity,
                COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
              FROM Orders o
              JOIN OrderItems oi ON o.idOrder = oi.orderId
              JOIN MenuItems mi ON oi.menuItemId = mi.idMenuItem
              LEFT JOIN Categories c ON mi.categoryId = c.idCategory
              WHERE o.orderDate >= ? AND o.orderDate <= ?
                AND o.status != 'cancelled'
                AND oi.status NOT IN ('cancelled', 'returned')${paymentFilter}
              GROUP BY mi.idMenuItem, mi.itemName, c.categoryName
              ORDER BY totalQuantity DESC
            `;
            itemSalesParams = [cafeDay.startDateTime, cafeDay.endDateTime];
          } else {
            itemSalesQuery = `
              SELECT
                mi.itemName,
                c.categoryName,
                COALESCE(SUM(oi.quantity), 0) as totalQuantity,
                COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
              FROM Orders o
              JOIN OrderItems oi ON o.idOrder = oi.orderId
              JOIN MenuItems mi ON oi.menuItemId = mi.idMenuItem
              LEFT JOIN Categories c ON mi.categoryId = c.idCategory
              WHERE DATE(o.orderDate) >= ? AND DATE(o.orderDate) <= ?
                AND o.status != 'cancelled'
                AND oi.status NOT IN ('cancelled', 'returned')${paymentFilter}
              GROUP BY mi.idMenuItem, mi.itemName, c.categoryName
              ORDER BY totalQuantity DESC
            `;
            itemSalesParams = [startDate, endDate];
          }

          let ordersListQuery, ordersListParams;
          if (startDate === endDate) {
            const cafeDay = getCafeDayRange(startDate);
            ordersListQuery = `
              SELECT orderNumber, orderDate, (totalAmount) as totalAmount, COALESCE(orderType, 'cashier') as orderType
              FROM Orders
              WHERE orderDate >= ? AND orderDate <= ? AND status != 'cancelled'${paymentFilter}
              ORDER BY orderDate DESC
            `;
            ordersListParams = [cafeDay.startDateTime, cafeDay.endDateTime];
          } else {
            ordersListQuery = `
              SELECT orderNumber, orderDate, (totalAmount) as totalAmount, COALESCE(orderType, 'cashier') as orderType
              FROM Orders
              WHERE DATE(orderDate) >= ? AND DATE(orderDate) <= ? AND status != 'cancelled'${paymentFilter}
              ORDER BY orderDate DESC
            `;
            ordersListParams = [startDate, endDate];
          }

          db.query(ordersListQuery, ordersListParams, (errOrders, ordersListRows) => {
            const orderDetails = errOrders ? [] : (ordersListRows || []).map(row => ({
              orderNumber: row.orderNumber,
              orderDate: row.orderDate,
              totalAmount: parseFloat(row.totalAmount || 0),
              orderType: row.orderType
            }));

            db.query(itemSalesQuery, itemSalesParams, (errItem, itemSalesRows) => {
              const itemSalesDetails = errItem ? [] : (itemSalesRows || []).map(row => ({
                itemName: row.itemName,
                categoryName: row.categoryName || 'غير محدد',
                totalQuantity: parseInt(row.totalQuantity || 0),
                revenue: parseFloat(row.revenue || 0)
              }));

              res.json({
                ...baseResponse,
                expenseDetails: expenseDetails,
                itemSalesDetails: itemSalesDetails,
                orderDetails: orderDetails
              });
            });
          });
        });
      });
    });
  });
  });
  });
};

// Sales Report (supports paymentMethod: all | cash | card)
exports.getSales = (req, res) => {
  const startDate = req.query.startDate || new Date().toISOString().split('T')[0];
  const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  const paymentMethod = (req.query.paymentMethod || 'all').toLowerCase();
  const categoryIds = req.query.categoryIds ? req.query.categoryIds.split(',').map(id => parseInt(id.trim())) : [];
  const menuItemIds = req.query.menuItemIds ? req.query.menuItemIds.split(',').map(id => parseInt(id.trim())) : [];

  const paymentFilter = paymentMethod === 'cash' ? " AND orderType = 'cashier'" : paymentMethod === 'card' ? " AND orderType = 'card'" : '';
  const paymentFilterO = paymentMethod === 'cash' ? " AND o.orderType = 'cashier'" : paymentMethod === 'card' ? " AND o.orderType = 'card'" : '';

  // Build filter conditions
  let categoryFilter = '';
  let menuItemFilter = '';
  let filterParams = [];
  
  if (categoryIds.length > 0) {
    const placeholders = categoryIds.map(() => '?').join(',');
    categoryFilter = ` AND mi.categoryId IN (${placeholders})`;
    filterParams.push(...categoryIds);
  }
  
  if (menuItemIds.length > 0) {
    const placeholders = menuItemIds.map(() => '?').join(',');
    menuItemFilter = ` AND mi.idMenuItem IN (${placeholders})`;
    filterParams.push(...menuItemIds);
  }
  
  // Daily sales breakdown - for single day use cafe day logic, for ranges use calendar days
  let dailySalesQuery, dailySalesParams;
  if (startDate === endDate) {
    // Single day - use cafe day logic
    const cafeDay = getCafeDayRange(startDate);
    // For daily sales, we need to join with order items if filters are applied
    if (categoryIds.length > 0 || menuItemIds.length > 0) {
      dailySalesQuery = `
        SELECT 
          DATE(o.orderDate) as date,
          COALESCE(SUM(oi.price * oi.quantity), 0) as totalSales,
          COUNT(DISTINCT o.idOrder) as orderCount
        FROM Orders o
        JOIN OrderItems oi ON o.idOrder = oi.orderId
        JOIN MenuItems mi ON oi.menuItemId = mi.idMenuItem
        WHERE o.orderDate >= ? AND o.orderDate <= ?
          AND o.status != 'cancelled'${paymentFilterO}
          ${categoryFilter}
          ${menuItemFilter}
        GROUP BY DATE(o.orderDate)
        ORDER BY date DESC
      `;
      dailySalesParams = [cafeDay.startDateTime, cafeDay.endDateTime, ...filterParams];
    } else {
      dailySalesQuery = `
        SELECT 
          DATE(orderDate) as date,
          COALESCE(SUM(totalAmount), 0) as totalSales,
          COUNT(*) as orderCount
        FROM Orders
        WHERE orderDate >= ? AND orderDate <= ?
          AND status != 'cancelled'${paymentFilter}
        GROUP BY DATE(orderDate)
        ORDER BY date DESC
      `;
      dailySalesParams = [cafeDay.startDateTime, cafeDay.endDateTime];
    }
  } else {
    // Date range - use calendar days
    if (categoryIds.length > 0 || menuItemIds.length > 0) {
      dailySalesQuery = `
        SELECT 
          DATE(o.orderDate) as date,
          COALESCE(SUM(oi.price * oi.quantity), 0) as totalSales,
          COUNT(DISTINCT o.idOrder) as orderCount
        FROM Orders o
        JOIN OrderItems oi ON o.idOrder = oi.orderId
        JOIN MenuItems mi ON oi.menuItemId = mi.idMenuItem
        WHERE DATE(o.orderDate) >= ? AND DATE(o.orderDate) <= ?
          AND o.status != 'cancelled'${paymentFilterO}
          ${categoryFilter}
          ${menuItemFilter}
        GROUP BY DATE(o.orderDate)
        ORDER BY date DESC
      `;
      dailySalesParams = [startDate, endDate, ...filterParams];
    } else {
      dailySalesQuery = `
        SELECT 
          DATE(orderDate) as date,
          COALESCE(SUM(totalAmount), 0) as totalSales,
          COUNT(*) as orderCount
        FROM Orders
        WHERE DATE(orderDate) >= ? AND DATE(orderDate) <= ?
          AND status != 'cancelled'${paymentFilter}
        GROUP BY DATE(orderDate)
        ORDER BY date DESC
      `;
      dailySalesParams = [startDate, endDate];
    }
  }
  
  // Sales by category - use same date logic as daily sales
  let categorySalesQuery, categorySalesParams;
  if (startDate === endDate) {
    const cafeDay = getCafeDayRange(startDate);
    categorySalesQuery = `
      SELECT 
        c.categoryName,
        COALESCE(SUM(oi.price * oi.quantity), 0) as totalSales,
        SUM(oi.quantity) as itemsSold
      FROM Orders o
      JOIN OrderItems oi ON o.idOrder = oi.orderId
      JOIN MenuItems mi ON oi.menuItemId = mi.idMenuItem
      JOIN Categories c ON mi.categoryId = c.idCategory
      WHERE o.orderDate >= ? AND o.orderDate <= ?
        AND o.status != 'cancelled'${paymentFilterO}
        ${categoryFilter}
        ${menuItemFilter}
      GROUP BY c.idCategory, c.categoryName
      ORDER BY totalSales DESC
    `;
    categorySalesParams = [cafeDay.startDateTime, cafeDay.endDateTime, ...filterParams];
  } else {
    categorySalesQuery = `
      SELECT 
        c.categoryName,
        COALESCE(SUM(oi.price * oi.quantity), 0) as totalSales,
        SUM(oi.quantity) as itemsSold
      FROM Orders o
      JOIN OrderItems oi ON o.idOrder = oi.orderId
      JOIN MenuItems mi ON oi.menuItemId = mi.idMenuItem
      JOIN Categories c ON mi.categoryId = c.idCategory
      WHERE DATE(o.orderDate) >= ? AND DATE(o.orderDate) <= ?
        AND o.status != 'cancelled'${paymentFilterO}
        ${categoryFilter}
        ${menuItemFilter}
      GROUP BY c.idCategory, c.categoryName
      ORDER BY totalSales DESC
    `;
    categorySalesParams = [startDate, endDate, ...filterParams];
  }

  // Top selling items - use same date logic
  let topItemsQuery, topItemsParams;
  if (startDate === endDate) {
    const cafeDay = getCafeDayRange(startDate);
    topItemsQuery = `
      SELECT
        mi.itemName,
        SUM(oi.quantity) as totalQuantity,
        COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
      FROM Orders o
      JOIN OrderItems oi ON o.idOrder = oi.orderId
      JOIN MenuItems mi ON oi.menuItemId = mi.idMenuItem
      WHERE o.orderDate >= ? AND o.orderDate <= ?
        AND o.status != 'cancelled'
        AND oi.status NOT IN ('cancelled', 'returned')${paymentFilterO}
        ${categoryFilter}
        ${menuItemFilter}
      GROUP BY mi.idMenuItem, mi.itemName
      ORDER BY totalQuantity DESC
    `;
    topItemsParams = [cafeDay.startDateTime, cafeDay.endDateTime, ...filterParams];
  } else {
    topItemsQuery = `
      SELECT
        mi.itemName,
        SUM(oi.quantity) as totalQuantity,
        COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
      FROM Orders o
      JOIN OrderItems oi ON o.idOrder = oi.orderId
      JOIN MenuItems mi ON oi.menuItemId = mi.idMenuItem
      WHERE DATE(o.orderDate) >= ? AND DATE(o.orderDate) <= ?
        AND o.status != 'cancelled'
        AND oi.status NOT IN ('cancelled', 'returned')${paymentFilterO}
        ${categoryFilter}
        ${menuItemFilter}
      GROUP BY mi.idMenuItem, mi.itemName
      ORDER BY totalQuantity DESC
    `;
    topItemsParams = [startDate, endDate, ...filterParams];
  }

  // Totals by payment (for stats: totalCash, totalCard)
  let byPaymentQuery, byPaymentParams;
  if (startDate === endDate) {
    const cafeDay = getCafeDayRange(startDate);
    byPaymentQuery = `
      SELECT COALESCE(orderType, 'cashier') as orderType, COALESCE(SUM(totalAmount), 0) as total
      FROM Orders
      WHERE orderDate >= ? AND orderDate <= ? AND status != 'cancelled'
      GROUP BY orderType
    `;
    byPaymentParams = [cafeDay.startDateTime, cafeDay.endDateTime];
  } else {
    byPaymentQuery = `
      SELECT COALESCE(orderType, 'cashier') as orderType, COALESCE(SUM(totalAmount), 0) as total
      FROM Orders
      WHERE DATE(orderDate) >= ? AND DATE(orderDate) <= ? AND status != 'cancelled'
      GROUP BY orderType
    `;
    byPaymentParams = [startDate, endDate];
  }

  db.query(byPaymentQuery, byPaymentParams, (err, byPaymentRows) => {
    let totalCash = 0, totalCard = 0;
    if (!err && byPaymentRows) {
      byPaymentRows.forEach(row => {
        const total = parseFloat(row.total || 0);
        if (row.orderType === 'card') totalCard = total;
        else totalCash += total;
      });
    }

  db.query(dailySalesQuery, dailySalesParams, (err, dailySales) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving daily sales."
      });
    }
    
    db.query(categorySalesQuery, categorySalesParams, (err, categorySales) => {
      if (err) {
        return res.status(500).json({
          message: err.message || "Error retrieving category sales."
        });
      }
      
      db.query(topItemsQuery, topItemsParams, (err, topItems) => {
        if (err) {
          return res.status(500).json({
            message: err.message || "Error retrieving top items."
          });
        }
        
        res.json({
          period: {
            startDate: startDate,
            endDate: endDate
          },
          totalCash: totalCash,
          totalCard: totalCard,
          dailySales: dailySales.map(d => ({
            ...d,
            totalSales: parseFloat(d.totalSales),
            orderCount: parseInt(d.orderCount)
          })),
          categorySales: categorySales.map(c => ({
            ...c,
            totalSales: parseFloat(c.totalSales),
            itemsSold: parseInt(c.itemsSold)
          })),
          topItems: topItems.map(t => ({
            ...t,
            totalQuantity: parseInt(t.totalQuantity),
            revenue: parseFloat(t.revenue)
          }))
        });
      });
    });
  });
  });
};

// Expense Report
exports.getExpenses = (req, res) => {
  const startDate = req.query.startDate || new Date().toISOString().split('T')[0];
  const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  
  // Get expense summary by category
  Expense.getSummary(startDate, endDate, (err, summary) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving expense summary."
      });
    }
    
    // Get total expenses
    Expense.getTotal(startDate, endDate, (err, total) => {
      if (err) {
        return res.status(500).json({
          message: err.message || "Error retrieving total expenses."
        });
      }
      
      // Get daily expenses
      const dailyExpensesQuery = `
        SELECT 
          expenseDate as date,
          COALESCE(SUM(amount), 0) as totalAmount,
          COUNT(*) as expenseCount
        FROM Expenses
        WHERE expenseDate >= ? AND expenseDate <= ?
        GROUP BY expenseDate
        ORDER BY date DESC
      `;
      
      db.query(dailyExpensesQuery, [startDate, endDate], (err, dailyExpenses) => {
        if (err) {
          return res.status(500).json({
            message: err.message || "Error retrieving daily expenses."
          });
        }

        // Get full expense details (every individual expense)
        Expense.getAll({ startDate, endDate }, (errDetails, expenseList) => {
          const details = (errDetails ? [] : (expenseList || [])).map(e => ({
            idExpense: e.idExpense,
            expenseDate: e.expenseDate,
            category: e.category,
            amount: parseFloat(e.amount || 0),
            description: e.description || '',
            receiptNumber: e.receiptNumber || '',
            recordedByName: e.recordedByName || '',
            supplierName: e.supplierName || ''
          }));

          res.json({
            period: {
              startDate: startDate,
              endDate: endDate
            },
            totalExpenses: parseFloat(total?.totalExpenses || 0),
            expenseCount: parseInt(total?.expenseCount || 0),
            byCategory: summary.map(s => ({
              ...s,
              count: parseInt(s.count),
              totalAmount: parseFloat(s.totalAmount)
            })),
            dailyExpenses: dailyExpenses.map(d => ({
              ...d,
              totalAmount: parseFloat(d.totalAmount),
              expenseCount: parseInt(d.expenseCount)
            })),
            details
          });
        });
      });
    });
  });
};

// Purchase Report
exports.getPurchases = (req, res) => {
  const startDate = req.query.startDate || new Date().toISOString().split('T')[0];
  const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  
  // Get purchases with supplier info
  const purchasesQuery = `
    SELECT 
      p.*,
      s.fullName as createdByName,
      COUNT(pi.idPurchaseItem) as itemsCount
    FROM Purchases p
    LEFT JOIN Staff s ON p.createdBy = s.idStaff
    LEFT JOIN PurchaseItems pi ON p.idPurchase = pi.purchaseId
    WHERE DATE(p.purchaseDate) >= ? AND DATE(p.purchaseDate) <= ?
    GROUP BY p.idPurchase
    ORDER BY p.purchaseDate DESC
  `;
  
  // Get purchases by supplier
  const supplierPurchasesQuery = `
    SELECT 
      supplierName,
      COUNT(*) as purchaseCount,
      COALESCE(SUM(totalAmount), 0) as totalAmount
    FROM Purchases
    WHERE DATE(purchaseDate) >= ? AND DATE(purchaseDate) <= ?
    GROUP BY supplierName
    ORDER BY totalAmount DESC
  `;
  
  // Get total purchases
  const totalPurchasesQuery = `
    SELECT 
      COALESCE(SUM(totalAmount), 0) as totalPurchases,
      COUNT(*) as purchaseCount
    FROM Purchases
    WHERE DATE(purchaseDate) >= ? AND DATE(purchaseDate) <= ?
      AND status IN ('received', 'partially_received')
  `;
  
  db.query(purchasesQuery, [startDate, endDate], (err, purchases) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving purchases."
      });
    }
    
    db.query(supplierPurchasesQuery, [startDate, endDate], (err, supplierPurchases) => {
      if (err) {
        return res.status(500).json({
          message: err.message || "Error retrieving supplier purchases."
        });
      }
      
      db.query(totalPurchasesQuery, [startDate, endDate], (err, totalResult) => {
        if (err) {
          return res.status(500).json({
            message: err.message || "Error retrieving total purchases."
          });
        }
        
        res.json({
          period: {
            startDate: startDate,
            endDate: endDate
          },
          totalPurchases: parseFloat(totalResult[0]?.totalPurchases || 0),
          purchaseCount: parseInt(totalResult[0]?.purchaseCount || 0),
          purchases: purchases.map(p => ({
            ...p,
            totalAmount: parseFloat(p.totalAmount),
            itemsCount: parseInt(p.itemsCount)
          })),
          bySupplier: supplierPurchases.map(s => ({
            ...s,
            purchaseCount: parseInt(s.purchaseCount),
            totalAmount: parseFloat(s.totalAmount)
          }))
        });
      });
    });
  });
};

// Daily Summary Report
exports.getDailySummary = (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  
  // Get sales
  Order.getDailySummary(date, (err, salesSummary) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving daily sales."
      });
    }
    
    const totalSales = parseFloat(salesSummary?.totalSales || 0);
    const orderCount = parseInt(salesSummary?.orderCount || 0);
    
    // Get expenses
    Expense.getTotal(date, date, (err, expenseTotal) => {
      const totalExpenses = parseFloat(expenseTotal?.totalExpenses || 0);
      
      // Get purchases
      const purchaseQuery = `
        SELECT COALESCE(SUM(totalAmount), 0) as totalPurchases,
               COUNT(*) as purchaseCount
        FROM Purchases
        WHERE DATE(purchaseDate) = ? 
          AND status IN ('received', 'partially_received')
      `;
      
      db.query(purchaseQuery, [date], (err, purchaseResult) => {
        if (err) {
          return res.status(500).json({
            message: err.message || "Error retrieving daily purchases."
          });
        }
        
        const totalPurchases = parseFloat(purchaseResult[0]?.totalPurchases || 0);
        const purchaseCount = parseInt(purchaseResult[0]?.purchaseCount || 0);
        profitForPeriod(date, date, (errProfit, pf) => {
        if (errProfit) return res.status(500).json({ message: errProfit.message });
        res.json({
          date: date,
          sales: {
            totalSales: totalSales,
            orderCount: orderCount,
            avgOrderValue: orderCount > 0 ? (totalSales / orderCount).toFixed(2) : 0
          },
          expenses: {
            totalExpenses: totalExpenses,
            expenseCount: expenseTotal?.expenseCount || 0
          },
          purchases: {
            totalPurchases: totalPurchases,
            purchaseCount: purchaseCount
          },
          summary: {
            netSales: pf.netSales,
            cogs: pf.cogs,
            grossProfit: pf.grossProfit,
            netProfit: pf.netProfit,
            profitMargin: pf.profitMargin
          }
        });
        });
      });
    });
  });
};

// Item Sales Report
exports.getItemSales = (req, res) => {
  const startDate = req.query.startDate || new Date().toISOString().split('T')[0];
  const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
  const itemIds = req.query.itemIds ? req.query.itemIds.split(',').map(id => parseInt(id.trim())) : [];
  
  if (!itemIds || itemIds.length === 0) {
    return res.status(400).json({
      message: "Item IDs are required. Please select at least one item."
    });
  }
  
  // Use cafe day logic for single day, calendar day for ranges
  let itemSalesQuery, itemSalesParams;
  if (startDate === endDate) {
    // Single day - use cafe day logic
    const cafeDay = getCafeDayRange(startDate);
    itemSalesQuery = `
      SELECT
        mi.idMenuItem,
        mi.itemName,
        c.categoryName,
        COALESCE(SUM(oi.quantity), 0) as totalQuantity,
        COALESCE(SUM(oi.price * oi.quantity), 0) as totalRevenue,
        COUNT(DISTINCT o.idOrder) as orderCount
      FROM Orders o
      JOIN OrderItems oi ON o.idOrder = oi.orderId
      JOIN MenuItems mi ON oi.menuItemId = mi.idMenuItem
      LEFT JOIN Categories c ON mi.categoryId = c.idCategory
      WHERE o.orderDate >= ? AND o.orderDate <= ?
        AND o.status != 'cancelled'
        AND oi.status NOT IN ('cancelled', 'returned')
        AND mi.idMenuItem IN (?)
      GROUP BY mi.idMenuItem, mi.itemName, c.categoryName
      ORDER BY totalQuantity DESC
    `;
    itemSalesParams = [cafeDay.startDateTime, cafeDay.endDateTime, itemIds];
  } else {
    // Date range - use calendar days
    itemSalesQuery = `
      SELECT
        mi.idMenuItem,
        mi.itemName,
        c.categoryName,
        COALESCE(SUM(oi.quantity), 0) as totalQuantity,
        COALESCE(SUM(oi.price * oi.quantity), 0) as totalRevenue,
        COUNT(DISTINCT o.idOrder) as orderCount
      FROM Orders o
      JOIN OrderItems oi ON o.idOrder = oi.orderId
      JOIN MenuItems mi ON oi.menuItemId = mi.idMenuItem
      LEFT JOIN Categories c ON mi.categoryId = c.idCategory
      WHERE DATE(o.orderDate) >= ? AND DATE(o.orderDate) <= ?
        AND o.status != 'cancelled'
        AND oi.status NOT IN ('cancelled', 'returned')
        AND mi.idMenuItem IN (?)
      GROUP BY mi.idMenuItem, mi.itemName, c.categoryName
      ORDER BY totalQuantity DESC
    `;
    itemSalesParams = [startDate, endDate, itemIds];
  }
  
  db.query(itemSalesQuery, itemSalesParams, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving item sales report."
      });
    }
    
    // Calculate totals
    const totals = results.reduce((acc, item) => {
      acc.totalQuantity += parseFloat(item.totalQuantity || 0);
      acc.totalRevenue += parseFloat(item.totalRevenue || 0);
      acc.totalOrders += parseInt(item.orderCount || 0);
      return acc;
    }, { totalQuantity: 0, totalRevenue: 0, totalOrders: 0 });
    
    res.json({
      period: {
        startDate: startDate,
        endDate: endDate
      },
      items: results.map(item => ({
        idMenuItem: item.idMenuItem,
        itemName: item.itemName,
        categoryName: item.categoryName || 'غير محدد',
        totalQuantity: parseInt(item.totalQuantity || 0),
        totalRevenue: parseFloat(item.totalRevenue || 0),
        orderCount: parseInt(item.orderCount || 0),
        averagePrice: parseFloat(item.totalQuantity || 0) > 0 
          ? (parseFloat(item.totalRevenue || 0) / parseFloat(item.totalQuantity || 0)).toFixed(2)
          : 0
      })),
      totals: {
        totalQuantity: totals.totalQuantity,
        totalRevenue: totals.totalRevenue,
        totalOrders: totals.totalOrders
      }
    });
  });
};

// Profit since opening (2025-11-24 until now) — aggregate only, no row fetching
const OPENING_DATE = '2025-11-24';

function formatMySQLDateTime(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

exports.getProfitSinceOpening = (req, res) => {
  const { todayBusinessDate } = require("../services/businessDay");
  profitForPeriod(OPENING_DATE, todayBusinessDate(), (err, pf) => {
    if (err) return res.status(500).json({ message: err.message || "Error computing profit." });
    res.json({ profit: pf.netProfit, ...pf });
  });
};

// Time-window Sales Report
// Returns all items sold within a date+time window.
// Query params: startDate, endDate (YYYY-MM-DD), startTime, endTime (HH:MM)
exports.getTimeSales = (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const startDate = req.query.startDate || today;
  const endDate = req.query.endDate || today;
  const startTime = (req.query.startTime || '00:00') + ':00';
  const endTime = (req.query.endTime || '23:59') + ':59';

  const startDateTime = `${startDate} ${startTime}`;
  const endDateTime = `${endDate} ${endTime}`;

  const query = `
    SELECT
      mi.idMenuItem,
      mi.itemName,
      COALESCE(c.categoryName, 'غير محدد') AS categoryName,
      COALESCE(SUM(oi.quantity), 0) AS totalQuantity,
      COALESCE(SUM(oi.price * oi.quantity), 0) AS totalRevenue,
      COUNT(DISTINCT o.idOrder) AS orderCount,
      MIN(o.orderDate) AS firstSoldAt,
      MAX(o.orderDate) AS lastSoldAt
    FROM Orders o
    JOIN OrderItems oi ON o.idOrder = oi.orderId
    JOIN MenuItems mi ON oi.menuItemId = mi.idMenuItem
    LEFT JOIN Categories c ON mi.categoryId = c.idCategory
    WHERE o.orderDate >= ? AND o.orderDate <= ?
      AND o.status != 'cancelled'
      AND oi.status NOT IN ('cancelled', 'returned')
    GROUP BY mi.idMenuItem, mi.itemName, c.categoryName
    ORDER BY totalRevenue DESC
  `;

  db.query(query, [startDateTime, endDateTime], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving time sales report."
      });
    }

    const items = (rows || []).map(r => ({
      idMenuItem: r.idMenuItem,
      itemName: r.itemName,
      categoryName: r.categoryName,
      totalQuantity: parseFloat(r.totalQuantity || 0),
      totalRevenue: parseFloat(r.totalRevenue || 0),
      orderCount: parseInt(r.orderCount || 0),
      firstSoldAt: r.firstSoldAt,
      lastSoldAt: r.lastSoldAt
    }));

    // Per-item-line detail (each individual sale with its timestamp)
    const detailsQuery = `
      SELECT
        oi.idOrderItem,
        o.orderNumber,
        o.orderDate,
        mi.itemName,
        COALESCE(c.categoryName, 'غير محدد') AS categoryName,
        COALESCE(sz.sizeName, '') AS sizeName,
        oi.quantity,
        oi.price AS unitPrice,
        (oi.price * oi.quantity) AS lineTotal
      FROM Orders o
      JOIN OrderItems oi ON o.idOrder = oi.orderId
      JOIN MenuItems mi ON oi.menuItemId = mi.idMenuItem
      LEFT JOIN Categories c ON mi.categoryId = c.idCategory
      LEFT JOIN ItemSizes sz ON oi.itemSizeId = sz.idItemSize
      WHERE o.orderDate >= ? AND o.orderDate <= ?
        AND o.status != 'cancelled'
        AND oi.status NOT IN ('cancelled', 'returned')
      ORDER BY o.orderDate ASC
    `;

    db.query(detailsQuery, [startDateTime, endDateTime], (errDet, detRows) => {
      const details = errDet ? [] : (detRows || []).map(r => ({
        idOrderItem: r.idOrderItem,
        orderNumber: r.orderNumber,
        orderDate: r.orderDate,
        itemName: r.itemName + (r.sizeName ? ` (${r.sizeName})` : ''),
        categoryName: r.categoryName,
        quantity: parseFloat(r.quantity || 0),
        unitPrice: parseFloat(r.unitPrice || 0),
        lineTotal: parseFloat(r.lineTotal || 0)
      }));

      // Distinct orders across all items in the window
      const orderQuery = `
        SELECT COUNT(DISTINCT o.idOrder) AS totalOrders
        FROM Orders o
        JOIN OrderItems oi ON o.idOrder = oi.orderId
        WHERE o.orderDate >= ? AND o.orderDate <= ?
          AND o.status != 'cancelled'
          AND oi.status NOT IN ('cancelled', 'returned')
      `;
      db.query(orderQuery, [startDateTime, endDateTime], (errOrder, orderRows) => {
        const totalOrders = parseInt(orderRows?.[0]?.totalOrders || 0);
        const totals = items.reduce((acc, i) => {
          acc.totalQuantity += i.totalQuantity;
          acc.totalRevenue += i.totalRevenue;
          return acc;
        }, { totalQuantity: 0, totalRevenue: 0, totalOrders });

        res.json({
          period: { startDateTime, endDateTime },
          items,
          details,
          totals
        });
      });
    });
  });
};

// Material Usage Report
exports.getMaterialUsage = (req, res) => {
  const startDate = req.query.startDate || new Date().toISOString().split('T')[0];
  const endDate = req.query.endDate || new Date().toISOString().split('T')[0];

  InventoryTransaction.getUsageSummary(startDate, endDate, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: err.message || "Error retrieving material usage report."
      });
    }

    // Calculate totals
    const totals = {
      totalPurchased: 0,
      totalUsed: 0,
      totalWasted: 0,
      totalCost: 0
    };

    data.forEach(item => {
      totals.totalPurchased += parseFloat(item.totalPurchased || 0);
      totals.totalUsed += parseFloat(item.totalUsed || 0);
      totals.totalWasted += parseFloat(item.totalWasted || 0);
      totals.totalCost += parseFloat(item.totalCost || 0);
    });

    res.json({
      data: data.map(item => ({
        ingredientName: item.ingredientName,
        unit: item.unit,
        totalPurchased: parseFloat(item.totalPurchased || 0),
        totalUsed: parseFloat(item.totalUsed || 0),
        totalWasted: parseFloat(item.totalWasted || 0),
        totalCost: parseFloat(item.totalCost || 0)
      })),
      totals: totals
    });
  });
};

module.exports = exports;

