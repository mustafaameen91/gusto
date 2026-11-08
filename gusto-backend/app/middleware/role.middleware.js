const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({
        message: "User role not found. Please authenticate first."
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`
      });
    }

    next();
  };
};

const roleMiddleware = {
  requireRole
};

module.exports = roleMiddleware;

