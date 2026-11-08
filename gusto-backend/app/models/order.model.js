const db = require("./db");

// Helper function to get cafe day range (7 AM to 2:59 AM next day)
// Returns { startDateTime, endDateTime } in MySQL format
const getCafeDayRange = (date) => {
  const selectedDate = new Date(date + "T00:00:00");
  const startDate = new Date(selectedDate);
  startDate.setHours(7, 0, 0, 0);

  const endDate = new Date(selectedDate);
  endDate.setDate(endDate.getDate() + 1);
  endDate.setHours(2, 59, 59, 999);

  const formatDateForMySQL = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  return {
    startDateTime: formatDateForMySQL(startDate),
    endDateTime: formatDateForMySQL(endDate),
  };
};

const Order = function (order) {
  this.orderNumber = order.orderNumber;
  this.orderType = order.orderType;
  this.tableNumber = order.tableNumber;
  this.status = order.status;
  this.totalAmount = order.totalAmount;
  this.discount = order.discount || 0;
  this.discountType = order.discountType || "amount";
  this.cashierId = order.cashierId;
  this.notes = order.notes;
};

Order.create = (newOrder, orderItems, result) => {
  // Start transaction
  db.getConnection((err, connection) => {
    if (err) {
      result(err, null);
      return;
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        result(err, null);
        return;
      }

      // Insert order
      connection.query("INSERT INTO Orders SET ?", newOrder, (err, res) => {
        if (err) {
          connection.rollback(() => {
            connection.release();
            result(err, null);
          });
          return;
        }

        const orderId = res.insertId;

        // Insert order items with status = 'pending'
        const orderItemsData = orderItems.map((item) => [
          orderId,
          item.menuItemId,
          item.itemSizeId,
          item.quantity,
          item.price,
          item.specialInstructions || null,
          "pending", // status
        ]);

        connection.query("INSERT INTO OrderItems (orderId, menuItemId, itemSizeId, quantity, price, specialInstructions, status) VALUES ?", [orderItemsData], (err, res) => {
          if (err) {
            connection.rollback(() => {
              connection.release();
              result(err, null);
            });
            return;
          }

          connection.commit((err) => {
            if (err) {
              connection.rollback(() => {
                connection.release();
                result(err, null);
              });
              return;
            }

            connection.release();
            result(null, { orderId, ...newOrder, items: orderItems });
          });
        });
      });
    });
  });
};

Order.findById = (id, result) => {
  const query = `
    SELECT 
      o.*,
      s.fullName as cashierName,
      oi.idOrderItem,
      oi.menuItemId,
      oi.itemSizeId,
      oi.quantity,
      oi.price,
      oi.specialInstructions,
      oi.status,
      oi.preparedAt,
      oi.completedAt,
      oi.cancelledAt,
      oi.preparedBy,
      mi.itemName,
      mi.imageUrl,
      mi.categoryId,
      c.categoryName,
      c.isKitchen,
      isz.sizeName
    FROM Orders o
    LEFT JOIN Staff s ON o.cashierId = s.idStaff
    LEFT JOIN OrderItems oi ON o.idOrder = oi.orderId
    LEFT JOIN MenuItems mi ON oi.menuItemId = mi.idMenuItem
    LEFT JOIN Categories c ON mi.categoryId = c.idCategory
    LEFT JOIN ItemSizes isz ON oi.itemSizeId = isz.idItemSize
    WHERE o.idOrder = ?
  `;

  db.query(query, [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.length) {
      // Group items
      const order = {
        idOrder: res[0].idOrder,
        orderNumber: res[0].orderNumber,
        orderType: res[0].orderType,
        tableNumber: res[0].tableNumber,
        status: res[0].status,
        totalAmount: res[0].totalAmount,
        cashierId: res[0].cashierId,
        cashierName: res[0].cashierName,
        orderDate: res[0].orderDate,
        preparedAt: res[0].preparedAt,
        completedAt: res[0].completedAt,
        cancelledAt: res[0].cancelledAt,
        notes: res[0].notes,
        items: [],
      };

      res.forEach((row) => {
        if (row.idOrderItem) {
          order.items.push({
            idOrderItem: row.idOrderItem,
            menuItemId: row.menuItemId,
            itemSizeId: row.itemSizeId,
            itemName: row.itemName,
            sizeName: row.sizeName,
            quantity: row.quantity,
            price: row.price,
            specialInstructions: row.specialInstructions,
            imageUrl: row.imageUrl,
            status: row.status,
            preparedAt: row.preparedAt,
            completedAt: row.completedAt,
            cancelledAt: row.cancelledAt,
            preparedBy: row.preparedBy,
            categoryId: row.categoryId,
            categoryName: row.categoryName,
            isKitchen: row.isKitchen,
          });
        }
      });

      result(null, order);
      return;
    }
    result({ kind: "not_found" }, null);
  });
};

Order.getAll = (filters, result) => {
  let query = `
    SELECT 
      o.*,
      s.fullName as cashierName
    FROM Orders o
    LEFT JOIN Staff s ON o.cashierId = s.idStaff
    WHERE 1=1
  `;

  const params = [];

  if (filters.status) {
    // Support multiple statuses separated by comma
    const statuses = filters.status.split(",").map((s) => s.trim());
    if (statuses.length > 0) {
      query += ` AND o.status IN (${statuses.map(() => "?").join(",")})`;
      statuses.forEach((s) => params.push(s));
    }
  }

  if (filters.date) {
    // Cafe day starts at 7:00 AM and ends at 2:59:59 AM next day
    // So a date like 2024-01-15 should include orders from 2024-01-15 07:00:00 to 2024-01-16 02:59:59
    // Handle date string in YYYY-MM-DD format
    let dateStr = filters.date;
    if (dateStr.includes("T")) {
      dateStr = dateStr.split("T")[0];
    }

    const selectedDate = new Date(dateStr + "T00:00:00");
    if (isNaN(selectedDate.getTime())) {
      // Invalid date, skip filter
      console.error("Invalid date filter:", filters.date);
    } else {
      const startDate = new Date(selectedDate);
      startDate.setHours(7, 0, 0, 0);

      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(2, 59, 59, 999);

      // Format dates for MySQL (YYYY-MM-DD HH:mm:ss)
      const formatDateForMySQL = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      query += " AND o.orderDate >= ? AND o.orderDate <= ?";
      params.push(formatDateForMySQL(startDate));
      params.push(formatDateForMySQL(endDate));
    }
  }

  query += " ORDER BY o.orderDate DESC";

  // Get total count for pagination
  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, "SELECT COUNT(*) as total FROM");

  db.query(countQuery, params, (err, countRes) => {
    if (err) {
      result(err, null);
      return;
    }

    const total = countRes[0]?.total || 0;

    // Apply pagination - default to 50 items per page if not specified
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50; // Default limit to prevent loading too many orders
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.query(query, params, (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      result(null, {
        items: res,
        total: total,
        page: page,
        limit: limit,
      });
    });
  });
};

Order.getActive = (result) => {
  // Limit to last 36 hours — covers active orders from previous cafe-day shift too
  // Active orders only (pending/preparing/ready), so old orders shouldn't appear anyway.
  // This drastically speeds up the query on systems with many historical orders.
  const query = `
    SELECT
      o.*,
      s.fullName as cashierName
    FROM Orders o
    LEFT JOIN Staff s ON o.cashierId = s.idStaff
    WHERE o.status IN ('pending', 'preparing', 'ready')
      AND o.orderDate >= DATE_SUB(NOW(), INTERVAL 36 HOUR)
    ORDER BY o.orderDate ASC
  `;

  db.query(query, (err, orders) => {
    if (err) {
      result(err, null);
      return;
    }

    if (orders.length === 0) {
      result(null, []);
      return;
    }

    // Fetch items for each order with category info and item status
    // Fix: Use proper IN clause with placeholders for each ID
    const orderIds = orders.map((o) => o.idOrder);
    const placeholders = orderIds.map(() => "?").join(",");
    const itemsQuery = `
      SELECT 
        oi.idOrderItem,
        oi.orderId,
        oi.menuItemId,
        oi.itemSizeId,
        oi.quantity,
        oi.price,
        oi.specialInstructions,
        oi.status,
        oi.preparedAt,
        oi.completedAt,
        oi.cancelledAt,
        oi.preparedBy,
        oi.createdAt,
        m.itemName,
        m.categoryId,
        c.categoryName,
        c.isKitchen,
        isz.sizeName as sizeName
      FROM OrderItems oi
      LEFT JOIN MenuItems m ON oi.menuItemId = m.idMenuItem
      LEFT JOIN Categories c ON m.categoryId = c.idCategory
      LEFT JOIN ItemSizes isz ON oi.itemSizeId = isz.idItemSize
      WHERE oi.orderId IN (${placeholders})
    `;

    db.query(itemsQuery, orderIds, (err, items) => {
      if (err) {
        result(err, null);
        return;
      }

      // Group items by orderId
      const ordersWithItems = orders.map((order) => ({
        ...order,
        items: items.filter((item) => item.orderId === order.idOrder),
      }));

      result(null, ordersWithItems);
    });
  });
};

Order.updateStatus = (id, status, result) => {
  // This method is kept for backward compatibility
  // But now we compute status from items instead
  const OrderItem = require("./orderItem.model");

  // First, compute the status from items
  OrderItem.computeOrderStatus(id, (err, computedStatus) => {
    if (err) {
      result(err, null);
      return;
    }

    // Update order status to match computed status
    let updateFields = "status = ?";
    const params = [computedStatus];

    if (computedStatus === "preparing") {
      updateFields += ", preparedAt = COALESCE(preparedAt, NOW())";
    } else if (computedStatus === "completed") {
      updateFields += ", completedAt = NOW()";
    } else if (computedStatus === "cancelled") {
      updateFields += ", cancelledAt = NOW()";
    }

    params.push(id);

    db.query(`UPDATE Orders SET ${updateFields} WHERE idOrder = ?`, params, (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ kind: "not_found" }, null);
        return;
      }
      result(null, res);
    });
  });
};

// Update order status after item status change
// Also computes timestamps from items (earliest preparedAt, latest completedAt, etc.)
Order.recomputeStatus = (id, result) => {
  const OrderItem = require("./orderItem.model");

  OrderItem.computeOrderStatus(id, (err, computedStatus) => {
    if (err) {
      result(err, null);
      return;
    }

    // Compute timestamps from items
    const timestampQuery = `
      SELECT 
        MIN(CASE WHEN status IN ('preparing', 'ready', 'completed') THEN preparedAt END) as earliestPreparedAt,
        MAX(CASE WHEN status = 'completed' THEN completedAt END) as latestCompletedAt,
        MAX(CASE WHEN status = 'cancelled' THEN cancelledAt END) as latestCancelledAt
      FROM OrderItems
      WHERE orderId = ?
    `;

    db.query(timestampQuery, [id], (err, timestampRes) => {
      if (err) {
        result(err, null);
        return;
      }

      const timestamps = timestampRes[0] || {};

      let updateFields = "status = ?";
      const params = [computedStatus];

      // Set preparedAt: earliest time any item started preparing
      if (computedStatus === "preparing" || computedStatus === "ready") {
        if (timestamps.earliestPreparedAt) {
          updateFields += ", preparedAt = ?";
          params.push(timestamps.earliestPreparedAt);
        } else {
          // Keep existing preparedAt if set, otherwise set to NOW
          updateFields += ", preparedAt = COALESCE(preparedAt, NOW())";
        }
      }

      // Set completedAt: latest time all items completed
      if (computedStatus === "completed") {
        if (timestamps.latestCompletedAt) {
          updateFields += ", completedAt = ?";
          params.push(timestamps.latestCompletedAt);
        } else {
          updateFields += ", completedAt = NOW()";
        }
      }

      // Set cancelledAt: latest time any item was cancelled
      if (computedStatus === "cancelled") {
        if (timestamps.latestCancelledAt) {
          updateFields += ", cancelledAt = ?";
          params.push(timestamps.latestCancelledAt);
        } else {
          updateFields += ", cancelledAt = NOW()";
        }
      }

      params.push(id);

      db.query(`UPDATE Orders SET ${updateFields} WHERE idOrder = ?`, params, (err, res) => {
        if (err) {
          result(err, null);
          return;
        }
        result(null, { status: computedStatus });
      });
    });
  });
};

Order.getDailySummary = (date, result) => {
  // Calculate total sales using cafe day logic (same as getAll)
  // Cafe day starts at 7:00 AM and ends at 2:59:59 AM next day
  // So a date like 2024-01-15 should include orders from 2024-01-15 07:00:00 to 2024-01-16 02:59:59
  const selectedDate = new Date(date + "T00:00:00");
  const startDate = new Date(selectedDate);
  startDate.setHours(7, 0, 0, 0);

  const endDate = new Date(selectedDate);
  endDate.setDate(endDate.getDate() + 1);
  endDate.setHours(2, 59, 59, 999);

  // Format dates for MySQL (YYYY-MM-DD HH:mm:ss)
  const formatDateForMySQL = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const query = `
    SELECT 
      COUNT(*) as orderCount,
      COALESCE(SUM(totalAmount), 0) as totalSales,
      COALESCE(AVG(totalAmount), 0) as averageOrderValue
    FROM Orders
    WHERE orderDate >= ? AND orderDate <= ? AND status != 'cancelled'
  `;

  db.query(query, [formatDateForMySQL(startDate), formatDateForMySQL(endDate)], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res[0]);
  });
};

/**
 * Summary for a specific shift (by dailyReceiptId): cash sales, credit sales (آجل), total, order count.
 */
Order.getSummaryByShift = (dailyReceiptId, result) => {
  const query = `
    SELECT
      COUNT(*) AS orderCount,
      COALESCE(SUM(CASE WHEN saleType = 'cash' THEN totalAmount ELSE 0 END), 0) AS cashSales,
      COALESCE(SUM(CASE WHEN saleType = 'credit' THEN totalAmount ELSE 0 END), 0) AS creditSales,
      COALESCE(SUM(totalAmount), 0) AS totalSales
    FROM Orders
    WHERE dailyReceiptId = ? AND status != 'cancelled'
  `;
  db.query(query, [dailyReceiptId], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, res[0]);
  });
};

module.exports = Order;
