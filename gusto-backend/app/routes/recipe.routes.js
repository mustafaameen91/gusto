module.exports = (app) => {
  const recipe = require("../controllers/recipe.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // All routes require authentication and admin role
  router.use(authMiddleware.verifyToken);
  router.use(authMiddleware.isAdmin);

  // Create a single recipe
  router.post("/", recipe.create);

  // Bulk update recipes for a menu item
  router.put("/menu-item/:menuItemId", recipe.bulkUpdate);

  // Get recipes for a menu item
  router.get("/menu-item/:menuItemId", recipe.getByMenuItem);

  // Delete a single recipe
  router.delete("/:id", recipe.delete);

  // Delete all recipes for a menu item
  router.delete("/menu-item/:menuItemId", recipe.deleteByMenuItem);

  app.use("/api/recipes", router);
};

