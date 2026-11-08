module.exports = (app) => {
  const { requireRole } = require("../middleware/role.middleware");
  const controller = require("../controllers/kitchenItemStock.controller");
  const auth = require("../middleware/auth.middleware");
  const router = require("express").Router();

  router.use(auth.verifyToken);
  router.get("/menu", controller.getMenu);
  const stockKeepers = requireRole(["admin", "storage", "kitchen"]);
  router.post("/add", stockKeepers, controller.add);
  router.patch("/decrease", stockKeepers, controller.decrease);
  router.put("/set", stockKeepers, controller.setQuantity);

  app.use("/api/kitchen-stock", router);
};
