module.exports = (app) => {
  const itemSizes = require("../controllers/itemSize.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // Get sizes for a menu item (public - for cashier)
  router.get("/menu-item/:menuItemId", itemSizes.getByMenuItem);

  // Admin routes
  router.post("/", authMiddleware.verifyToken, authMiddleware.isAdmin, itemSizes.create);
  router.put("/:id", authMiddleware.verifyToken, authMiddleware.isAdmin, itemSizes.update);
  router.delete("/:id", authMiddleware.verifyToken, authMiddleware.isAdmin, itemSizes.delete);

  app.use("/api/item-sizes", router);
};

