const { ApiError, ErrorCodes } = require('../utils/errorCodes');

/**
 * Usage: router.post('/admin/x', requireAuth, requireRole('admin'), handler)
 * Must run after requireAuth so req.user is already set.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, ErrorCodes.LOGIN_REQUIRED, 'Please log in to continue.');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, ErrorCodes.FORBIDDEN, 'You do not have permission to do that.');
    }
    return next();
  };
}

module.exports = { requireRole };
