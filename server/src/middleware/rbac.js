const AppError = require("../utils/AppError");

// Usage: router.delete("/:id", protect, restrictTo("admin"), handler)
// Must run AFTER `protect`, since it reads req.user set by that middleware.
function restrictTo(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new AppError("You do not have permission to perform this action.", 403, "FORBIDDEN");
    }
    next();
  };
}

module.exports = { restrictTo };
