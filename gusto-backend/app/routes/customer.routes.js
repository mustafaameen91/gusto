module.exports = (app) => {
  const { requireRole } = require("../middleware/role.middleware");
  const customers = require("../controllers/customer.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const staff = [authMiddleware.verifyToken, requireRole(["admin", "cashier", "supervisor"])];
  const managers = [authMiddleware.verifyToken, requireRole(["admin", "supervisor"])];
  app.get("/api/customers", ...staff, customers.getAll);
  app.get("/api/customers/:id", ...staff, customers.findById);
  app.get("/api/customers/:id/profile", ...staff, customers.getProfile);
  app.post("/api/customers", ...staff, customers.create);
  app.post("/api/customers/:id/receipts", ...staff, customers.createReceipt);
  app.put("/api/customers/:id", ...managers, customers.update);
};
