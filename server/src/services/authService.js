const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { env } = require('../config/env');
const { ApiError, ErrorCodes } = require('../utils/errorCodes');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('./tokenService');

async function registerUser({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, ErrorCodes.EMAIL_ALREADY_REGISTERED, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const user = await User.create({ name, email, passwordHash });
  return user;
}

async function verifyCredentials(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, ErrorCodes.INVALID_CREDENTIALS, 'Incorrect email or password.');
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new ApiError(401, ErrorCodes.INVALID_CREDENTIALS, 'Incorrect email or password.');
  }

  return user;
}

/** Issues a fresh access+refresh pair and persists the refresh token's hash for later revocation/rotation. */
async function issueSession(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  return { accessToken, refreshToken };
}

/** Verifies a refresh token against both its signature and the hash stored on the user (so logout actually revokes it). */
async function rotateSession(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, ErrorCodes.INVALID_REFRESH_TOKEN, 'Your session has expired. Please log in again.');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new ApiError(401, ErrorCodes.INVALID_REFRESH_TOKEN, 'Your session has expired. Please log in again.');
  }

  return issueSession(user);
}

async function revokeSession(userId) {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
}

module.exports = { registerUser, verifyCredentials, issueSession, rotateSession, revokeSession };
