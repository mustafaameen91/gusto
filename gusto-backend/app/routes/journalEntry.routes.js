const journalEntries = require("../controllers/journalEntry.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

module.exports = (app) => {
  app.get(
    "/api/journal-entries",
    authMiddleware.verifyToken,
    roleMiddleware.requireRole(["admin"]),
    journalEntries.getAll
  );
};
