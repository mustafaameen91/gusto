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
  
  db.query(
    `UPDATE OrderItems SET ${updateFields} WHERE idOrderItem = ?`,
    params,
    (err, res) => {
      if (err) {
        console.error(`[OrderItem.updateStatus] Error updating item ${id}:`, err);
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        console.warn(`[OrderItem.updateStatus] Item ${id} not found`);
        result({ kind: "not_found" }, null);
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

// Compute overall order status from items
OrderItem.computeOrderStatus = (orderId, result) => {
  const query = `
    SELECT 
      COUNT(*) as totalItems,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
      SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparingCount,
      SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as readyCount,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedCount,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelledCount
    FROM OrderItems
    WHERE orderId = ?
  `;
  
  db.query(query, [orderId], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    
    if (res.length === 0 || res[0].totalItems === 0) {
      result(null, 'pending');
      return;
    }
    
    const stats = res[0];
    
    // Convert counts to numbers (MySQL SUM returns strings/decimals)
    const totalItems = parseInt(stats.totalItems) || 0;
    const pendingCount = parseInt(stats.pendingCount) || 0;
    const preparingCount = parseInt(stats.preparingCount) || 0;
    const readyCount = parseInt(stats.readyCount) || 0;
    const completedCount = parseInt(stats.completedCount) || 0;
    const cancelledCount = parseInt(stats.cancelledCount) || 0;
    
    // Debug logging
    console.log(`[computeOrderStatus] Order ${orderId} - Items: total=${totalItems}, pending=${pendingCount}, preparing=${preparingCount}, ready=${readyCount}, completed=${completedCount}, cancelled=${cancelledCount}`);
    
    // Determine overall status based on item statuses
    // Priority: cancelled > completed > ready > preparing > pending
    let overallStatus = 'pending';
    
    // Check if all items are cancelled
    if (cancelledCount === totalItems && totalItems > 0) {
      overallStatus = 'cancelled';
    }
    // Check if all items are completed
    else if (completedCount === totalItems && totalItems > 0) {
      overallStatus = 'completed';
    }
    // Check if all items are ready (and none are cancelled)
    else if (readyCount === totalItems && totalItems > 0 && cancelledCount === 0) {
      overallStatus = 'ready';
    }
    // If any items are preparing, ready, or completed (but not all completed), status is preparing
    else if (preparingCount > 0 || readyCount > 0 || completedCount > 0) {
      overallStatus = 'preparing';
    }
    // If all items are pending
    else if (pendingCount === totalItems && totalItems > 0) {
      overallStatus = 'pending';
    }
    
    console.log(`[computeOrderStatus] Order ${orderId} - Computed status: ${overallStatus}`);
    result(null, overallStatus);
  });
};

module.exports = OrderItem;

