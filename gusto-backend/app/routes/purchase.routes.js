module.exports = (app) => {
  const purchases = require("../controllers/purchase.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // All routes require authentication
  router.use(authMiddleware.verifyToken);

  // Generate purchase number
  router.get("/generate-number", purchases.generateNumber);

  // Create a new purchase order (Purchases role or Admin)
  router.post("/", authMiddleware.isPurchases, purchases.create);

  // Retrieve all purchases (All authenticated users)
  router.get("/", purchases.findAll);

  // Retrieve a single purchase with items (All authenticated users)
  router.get("/:id", purchases.findOne);

  // Receive purchase (confirm quantities and update inventory) - Storage role or Admin
  router.post("/:id/receive", authMiddleware.isStorage, purchases.receive);

  // Update a purchase (Purchases role or Admin, but only own purchases for purchases role)
  router.put("/:id", authMiddleware.isPurchases, purchases.update);

  // Delete a purchase (Admin only)
  router.delete("/:id", authMiddleware.isAdmin, purchases.delete);

  app.use("/api/purchases", router);
};

