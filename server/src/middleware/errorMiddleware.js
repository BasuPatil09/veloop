const { ApiError, ErrorCodes } = require('../utils/errorCodes');
const { fail } = require('../utils/apiResponse');
const { env } = require('../config/env');

function notFoundHandler(req, res) {
  return fail(res, 404, ErrorCodes.NOT_FOUND, 'This endpoint does not exist.');
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return fail(res, err.statusCode, err.code, err.message);
  }

  // Mongoose duplicate key (e.g. email already registered, or the
  // user+giveaway unique index catching a race condition)
  if (err.code === 11000) {
    return fail(res, 409, ErrorCodes.VALIDATION_ERROR, 'This record already exists.');
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    return fail(res, 400, ErrorCodes.VALIDATION_ERROR, message);
  }

  // Anything unexpected: log the real error server-side, never expose it to the client.
  // eslint-disable-next-line no-console
  console.error('[unhandled error]', err);

  return fail(
    res,
    500,
    ErrorCodes.INTERNAL_ERROR,
    env.nodeEnv === 'development' ? err.message : 'Something went wrong. Please try again.',
  );
}

module.exports = { notFoundHandler, errorHandler };
