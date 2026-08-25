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
  // Production deploys the frontend and backend on different domains (e.g. a
  // vercel.app frontend calling an onrender.com backend). SameSite=Lax only
  // sends cookies on cross-site top-level navigation, NOT on cross-site
  // fetch/XHR — which is exactly how the refresh call is made. SameSite=None
  // is required for that to work, and browsers mandate Secure whenever
  // SameSite=None is used. Local dev stays same-site (both on localhost), so
  // Lax + non-secure works fine there without needing HTTPS locally.
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
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
  const user = await User.findByPk(req.user.id);
  if (!user) {
    throw new ApiError(404, ErrorCodes.NOT_FOUND, 'User not found.');
  }
  return ok(res, { user: serializeUser(user) });
});

module.exports = { register, login, refresh, logout, me };
