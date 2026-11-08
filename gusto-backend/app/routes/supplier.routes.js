module.exports = (app) => {
  const suppliers = require("../controllers/supplier.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const roleMiddleware = require("../middleware/role.middleware");

  const router = require("express").Router();

  // All routes require authentication
  router.use(authMiddleware.verifyToken);

  // Create a new supplier (admin only)
  router.post("/", roleMiddleware.requireRole(["admin"]), suppliers.create);

  // Get summary stats for all suppliers
  router.get("/summary", suppliers.getSummaryStats);

  // Get all suppliers
  router.get("/", suppliers.getAll);

  // Transfer debt between suppliers (admin only)
  router.post("/transfer", roleMiddleware.requireRole(["admin"]), suppliers.createTransfer);

  // Get supplier profile (debt, purchases, payments, service invoices)
  router.get("/:id/profile", suppliers.getProfile);

  // Service invoices (multi-service per invoice)
  router.get("/:id/service-invoices", suppliers.getServiceInvoices);
  router.post("/:id/service-invoices", roleMiddleware.requireRole(["admin"]), suppliers.createServiceInvoice);
  router.get("/:id/service-invoices/:invoiceId", suppliers.getServiceInvoiceById);
  router.put("/:id/service-invoices/:invoiceId", roleMiddleware.requireRole(["admin"]), suppliers.updateServiceInvoice);
  router.delete("/:id/service-invoices/:invoiceId", roleMiddleware.requireRole(["admin"]), suppliers.deleteServiceInvoice);

  // Get payments for supplier
  router.get("/:id/payments", suppliers.getPayments);

  // Create payment to supplier (admin only)
  router.post("/:id/payments", roleMiddleware.requireRole(["admin"]), suppliers.createPayment);

  // Get credits for supplier (what supplier owes us)
  router.get("/:id/credits", suppliers.getCredits);

  // Create credit (what supplier owes us) (admin only)
  router.post("/:id/credits", roleMiddleware.requireRole(["admin"]), suppliers.createCredit);

  // Get supplier by ID
  router.get("/:id", suppliers.findById);

  // Update supplier (admin only)
  router.put("/:id", roleMiddleware.requireRole(["admin"]), suppliers.update);

  // Delete supplier (admin only)
  router.delete("/:id", roleMiddleware.requireRole(["admin"]), suppliers.delete);

  app.use("/api/suppliers", router);
};

