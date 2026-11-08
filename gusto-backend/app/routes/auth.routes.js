module.exports = (app) => {
  const auth = require("../controllers/auth.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // Public route
  router.post("/login", auth.login);
  // Creating staff accounts is admin-only (used by the Staff page)
  router.post("/register", authMiddleware.verifyToken, authMiddleware.isAdmin, auth.register);

  // Credential verification (requires existing session token)
  router.post("/verify-credentials", authMiddleware.verifyToken, auth.verifyCredentials);

  // Protected routes
  router.get("/me", authMiddleware.verifyToken, auth.me);

  app.use("/api/auth", router);
};

