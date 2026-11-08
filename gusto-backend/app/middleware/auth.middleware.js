const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in .env");
}

// The token proves who is calling; whether they may still use the app (active, which role)
// is read from Staff, so deactivating a user or changing their role takes effect at once.
// A few seconds of caching keeps this to roughly one query per user per burst of requests.
const staffCache = new Map();
const CACHE_MS = 5000;
function currentStaff(id, cb) {
  const hit = staffCache.get(id);
  if (hit && Date.now() - hit.at < CACHE_MS) return cb(null, hit.row);
  const db = require("../models/db");
  db.query("SELECT idStaff, role, isActive FROM Staff WHERE idStaff = ?", [id], (err, rows) => {
    if (err) return cb(err);
    const row = rows[0] || null;
    staffCache.set(id, { row, at: Date.now() });
    cb(null, row);
  });
}

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).json({
      message: "No token provided!"
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        message: "Unauthorized!"
      });
    }
    currentStaff(decoded.id, (errStaff, staff) => {
      if (errStaff) return res.status(500).json({ message: "Error checking user." });
      if (!staff || !staff.isActive) {
        return res.status(401).json({ message: "الحساب غير فعّال. يرجى مراجعة الإدارة.", code: "ACCOUNT_INACTIVE" });
      }
      req.userId = staff.idStaff;
      req.userRole = staff.role;
      next();
    });
  });
};

const isAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({
      message: "Require Admin Role!"
    });
  }
  next();
};

const isPurchases = (req, res, next) => {
  if (req.userRole !== "admin" && req.userRole !== "purchases") {
    return res.status(403).json({
      message: "Require Purchases or Admin Role!"
    });
  }
  next();
};

const isStorage = (req, res, next) => {
  if (req.userRole !== "admin" && req.userRole !== "storage") {
    return res.status(403).json({
      message: "Require Storage or Admin Role!"
    });
  }
  next();
};

const authMiddleware = {
  verifyToken,
  isAdmin,
  isPurchases,
  isStorage
};

module.exports = authMiddleware;

