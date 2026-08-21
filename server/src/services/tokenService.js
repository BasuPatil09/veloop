const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('../config/env');

/** Short-lived access token carried in the Authorization header. */
function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

/** Longer-lived refresh token carried in an httpOnly cookie. Only its hash is stored on the user. */
function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString() }, env.refreshSecret, {
    expiresIn: env.refreshExpiresIn,
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshSecret);
}

/** Refresh tokens are stored hashed — a DB read alone is never enough to impersonate a session. */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
};
