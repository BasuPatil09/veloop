const { verifyAccessToken } = require('../services/tokenService');
const { ApiError, ErrorCodes } = require('../utils/errorCodes');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * Requires a valid access token. Identity for every downstream handler comes
 * ONLY from req.user (derived from the verified token) — never from
 * req.body.userId, which a client can set to anything.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, ErrorCodes.LOGIN_REQUIRED, 'Please log in to continue.');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    throw new ApiError(401, ErrorCodes.LOGIN_REQUIRED, 'Your session has expired. Please log in again.');
  }
});

/** Same as requireAuth, but doesn't fail when there's no token — for routes that behave differently for guests. */
const attachUserIfPresent = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // invalid/expired token on an optional-auth route — treat as a guest, don't error
  }
  return next();
};

module.exports = { requireAuth, attachUserIfPresent };
