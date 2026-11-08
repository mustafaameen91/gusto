module.exports = (app) => {
  const categories = require("../controllers/category.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // Public routes for QR menu (no authentication required)
  router.get("/", categories.findAll);
  router.get("/:id", categories.findOne);

  // Protected admin routes (require authentication)
  router.post("/", authMiddleware.verifyToken, authMiddleware.isAdmin, categories.create);
  router.put("/:id", authMiddleware.verifyToken, authMiddleware.isAdmin, categories.update);
  router.delete("/:id", authMiddleware.verifyToken, authMiddleware.isAdmin, categories.delete);

  app.use("/api/categories", router);
};

