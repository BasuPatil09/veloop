const rateLimit = require('express-rate-limit');
const { ErrorCodes } = require('../utils/errorCodes');
const { env } = require('../config/env');

function friendlyLimitHandler(req, res) {
  res.status(429).json({
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMITED,
      message: "Too many attempts. Please wait a moment and try again.",
    },
  });
}

// Test runs fire many requests in quick succession from the same "IP" — that's a
// property of the test harness, not real traffic, so rate limiting is a no-op there.
// It stays fully active in development and production.
const skipInTest = () => env.nodeEnv === 'test';

// Generous general-purpose limiter, applied globally in app.js.
const generalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: friendlyLimitHandler,
});

// Tight limiter for auth endpoints — these are the classic brute-force/credential-stuffing targets.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: friendlyLimitHandler,
});

// Reserved for /join and /claim once those routes exist (Phase 3/4) — same shape, separate budget.
const sensitiveActionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: friendlyLimitHandler,
});

module.exports = { generalLimiter, authLimiter, sensitiveActionLimiter };
