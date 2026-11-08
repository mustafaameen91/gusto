const Payment = require("../models/payment.model");

/**
 * List order payments with optional filters: startDate, endDate, dailyReceiptId, limit.
 */
exports.list = (req, res) => {
  const filters = {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    dailyReceiptId: req.query.dailyReceiptId,
    limit: req.query.limit || 100
  };
  Payment.getAll(filters, (err, data) => {
    if (err) {
      console.error("[GET /api/payments] Error:", {
        message: err.message,
        code: err.code,
        sql: err.sql
      });
      return res.status(500).json({
        message: err.message || "Error retrieving payments."
      });
    }
    res.json(data);
  });
};
