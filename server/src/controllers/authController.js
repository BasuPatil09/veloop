const User = require('../models/User');
const authService = require('../services/authService');
const { ok } = require('../utils/apiResponse');
const { serializeUser } = require('../utils/serializeUser');
const { asyncHandler } = require('../utils/asyncHandler');
const { env } = require('../config/env');
const { ApiError, ErrorCodes } = require('../utils/errorCodes');

const REFRESH_COOKIE_NAME = 'veloop_refresh_token';

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  maxAge: env.refreshExpiresInMs,
  path: '/api/auth',
};

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.registerUser({ name, email, password });
  const { accessToken, refreshToken } = await authService.issueSession(user);

  setRefreshCookie(res, refreshToken);
  return ok(res, { user: serializeUser(user), accessToken }, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.verifyCredentials(email, password);
  const { accessToken, refreshToken } = await authService.issueSession(user);

  setRefreshCookie(res, refreshToken);
  return ok(res, { user: serializeUser(user), accessToken });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    throw new ApiError(401, ErrorCodes.LOGIN_REQUIRED, 'Please log in to continue.');
  }

  const { accessToken, refreshToken: nextRefreshToken } = await authService.rotateSession(refreshToken);
  setRefreshCookie(res, nextRefreshToken);
  return ok(res, { accessToken });
});

const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await authService.revokeSession(req.user.id);
  }
  clearRefreshCookie(res);
  return ok(res, { loggedOut: true });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, ErrorCodes.NOT_FOUND, 'User not found.');
  }
  return ok(res, { user: serializeUser(user) });
});

module.exports = { register, login, refresh, logout, me };
