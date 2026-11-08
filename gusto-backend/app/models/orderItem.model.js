const db = require("./db");

const OrderItem = function(orderItem) {
  this.orderId = orderItem.orderId;
  this.menuItemId = orderItem.menuItemId;
  this.itemSizeId = orderItem.itemSizeId;
  this.quantity = orderItem.quantity;
  this.price = orderItem.price;
  this.specialInstructions = orderItem.specialInstructions;
  this.status = orderItem.status || 'pending';
  this.preparedBy = orderItem.preparedBy || null;
};

// Update item status
OrderItem.updateStatus = (id, status, preparedBy, result) => {
  let updateFields = "status = ?";
  const params = [status];
  
  if (status === 'preparing') {
    updateFields += ", preparedAt = NOW()";
    if (preparedBy) {
      updateFields += ", preparedBy = ?";
      params.push(preparedBy);
    }
  } else if (status === 'ready') {
    // If moving to ready, ensure preparedAt is set if not already
    updateFields += ", preparedAt = COALESCE(preparedAt, NOW())";
  } else if (status === 'completed') {
    updateFields += ", completedAt = NOW()";
    // Ensure preparedAt is set if not already
    updateFields += ", preparedAt = COALESCE(preparedAt, NOW())";
  } else if (status === 'cancelled') {
    updateFields += ", cancelledAt = NOW()";
  }
  
  params.push(id);
  
  console.log(`[OrderItem.updateStatus] Updating item ${id} to status: ${status}`);
  
  // Kitchen statuses only move forward, and cancelled/returned lines are never touched
  // (cancelling goes through the cancellation service, returns through the returns flow)
  params.push(status);
  db.query(
    `UPDATE OrderItems SET ${updateFields}
     WHERE idOrderItem = ?
       AND status IN ('pending', 'preparing', 'ready', 'completed')
       AND FIELD(status, 'pending', 'preparing', 'ready', 'completed') < FIELD(?, 'pending', 'preparing', 'ready', 'completed')`,
    params,
    (err, res) => {
      if (err) {
        console.error(`[OrderItem.updateStatus] Error updating item ${id}:`, err);
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        // Already at or past this status, or cancelled/returned: nothing to do
        result(null, { unchanged: true });
        return;
      }
      console.log(`[OrderItem.updateStatus] Item ${id} updated successfully to ${status}`);
      result(null, res);
    }
  );
};

// Get item by ID
OrderItem.findById = (id, result) => {
  const query = `
    SELECT 
      oi.*,
      m.itemName,
      m.categoryId,
      c.categoryName,
      c.isKitchen,
      isz.sizeName
    FROM OrderItems oi
    LEFT JOIN MenuItems m ON oi.menuItemId = m.idMenuItem
    LEFT JOIN Categories c ON m.categoryId = c.idCategory
    LEFT JOIN ItemSizes isz ON oi.itemSizeId = isz.idItemSize
    WHERE oi.idOrderItem = ?
  `;
  
  db.query(query, [id], (err, res) => {
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

// Compute overall order status from its live lines (cancelled and returned lines are done with)
OrderItem.computeOrderStatus = (orderId, result) => {
  const query = `
    SELECT
      COUNT(*) AS totalItems,
      SUM(status = 'cancelled') AS cancelledCount,
      SUM(status NOT IN ('cancelled', 'returned')) AS liveCount,
      SUM(status = 'preparing') AS preparingCount,
      SUM(status = 'ready') AS readyCount,
      SUM(status = 'completed') AS completedCount
    FROM OrderItems
    WHERE orderId = ?
  `;
  db.query(query, [orderId], (err, res) => {
    if (err) return result(err, null);
    const n = (k) => parseInt(res[0]?.[k] || 0, 10);
    const total = n("totalItems"), live = n("liveCount");
    let status = "pending";
    if (total > 0 && n("cancelledCount") === total) status = "cancelled";
    else if (live === 0 && total > 0) status = "completed"; // everything returned or cancelled after serving
    else if (n("completedCount") === live) status = "completed";
    else if (n("readyCount") + n("completedCount") === live) status = "ready";
    else if (n("preparingCount") + n("readyCount") + n("completedCount") > 0) status = "preparing";
    result(null, status);
  });
};

module.exports = OrderItem;

