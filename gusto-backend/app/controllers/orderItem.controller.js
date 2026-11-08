const OrderItem = require("../models/orderItem.model");
const Order = require("../models/order.model");
const { cancelOrderItems } = require("../services/cancelOrderItems.service");

// Update item status
exports.updateStatus = (req, res) => {
  if (!req.body.status) {
    return res.status(400).json({
      message: "Status is required!"
    });
  }

  const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
  if (!validStatuses.includes(req.body.status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  // Get the item first to check order
  OrderItem.findById(req.params.id, (err, item) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Order item not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error retrieving order item"
      });
    }

    // Cancelling changes money and stock: handled as its own guarded transaction
    if (req.body.status === "cancelled") {
      return cancelOrderItems(item.orderId, [Number(req.params.id)], { id: req.userId, role: req.userRole }, (errC, result) => {
        if (errC) return res.status(errC.status || 500).json({ message: errC.message });
        const io = req.app.get("io");
        if (io) {
          ["kitchen", "barista", "cashier"].forEach((room) => {
            io.to(room).emit("item_status_changed", { orderItemId: req.params.id, orderId: item.orderId, status: "cancelled" });
            io.to(room).emit("order_status_changed", { orderId: item.orderId, status: result.orderStatus });
          });
        }
        res.json({ message: "تم إلغاء الصنف", ...result });
      });
    }

    // Update item status
    OrderItem.updateStatus(
      req.params.id, 
      req.body.status, 
      req.userId, // preparedBy
      (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            return res.status(404).json({
              message: `Order item not found with id ${req.params.id}.`
            });
          }
          return res.status(500).json({
            message: "Error updating order item status"
          });
        }

        // Send response immediately
        res.json({ 
          message: "Order item status updated successfully"
        });

        // Recompute overall order status asynchronously (don't block response)
        // Note: When updating multiple items, this will be called multiple times
        // The final recompute from frontend will ensure correct status
        // Use setTimeout to ensure item update is committed before recomputing
        setTimeout(() => {
          Order.recomputeStatus(item.orderId, (err, orderStatus) => {
            if (err) {
              console.error(`[orderItem.updateStatus] Error recomputing order ${item.orderId} status:`, err);
              // Don't fail the request, just log
            } else {
              console.log(`[orderItem.updateStatus] Order ${item.orderId} status recomputed to: ${orderStatus?.status || 'unknown'}`);
            }

            // Emit WebSocket event
            const io = req.app.get('io');
            if (io) {
              io.to('kitchen').emit('item_status_changed', {
                orderItemId: req.params.id,
                orderId: item.orderId,
                status: req.body.status
              });
              io.to('barista').emit('item_status_changed', {
                orderItemId: req.params.id,
                orderId: item.orderId,
                status: req.body.status
              });
              // Also emit order status change
              if (orderStatus) {
                io.to('kitchen').emit('order_status_changed', {
                  orderId: item.orderId,
                  status: orderStatus.status
                });
                io.to('barista').emit('order_status_changed', {
                  orderId: item.orderId,
                  status: orderStatus.status
                });
              }
            }
          });
        }, 150); // Small delay to ensure item update is committed
      }
    );
  });
};

// Get item by ID
exports.findOne = (req, res) => {
  OrderItem.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({
          message: `Order item not found with id ${req.params.id}.`
        });
      }
      return res.status(500).json({
        message: "Error retrieving order item with id " + req.params.id
      });
    }
    res.json(data);
  });
};

