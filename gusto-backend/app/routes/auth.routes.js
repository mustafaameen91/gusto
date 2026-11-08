module.exports = (app) => {
  const auth = require("../controllers/auth.controller");
  const authMiddleware = require("../middleware/auth.middleware");

  const router = require("express").Router();

  // Public routes
  router.post("/login", auth.login);
  router.post("/register", auth.register);

  // Credential verification (requires existing session token)
  router.post("/verify-credentials", authMiddleware.verifyToken, auth.verifyCredentials);

  // Protected routes
  router.get("/me", authMiddleware.verifyToken, auth.me);

  app.use("/api/auth", router);
};

