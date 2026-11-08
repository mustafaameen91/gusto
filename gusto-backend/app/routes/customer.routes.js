module.exports = (app) => {
  const customers = require("../controllers/customer.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  app.get("/api/customers", authMiddleware.verifyToken, customers.getAll);
  app.get("/api/customers/:id", authMiddleware.verifyToken, customers.findById);
  app.get("/api/customers/:id/profile", authMiddleware.verifyToken, customers.getProfile);
  app.post("/api/customers", authMiddleware.verifyToken, customers.create);
  app.post("/api/customers/:id/receipts", authMiddleware.verifyToken, customers.createReceipt);
  app.put("/api/customers/:id", authMiddleware.verifyToken, customers.update);
};
