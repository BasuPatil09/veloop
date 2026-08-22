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

  // Sequelize unique constraint violation (e.g. email already registered, or the
  // userId+giveawayId unique key catching a race condition on join)
  if (err.name === 'SequelizeUniqueConstraintError') {
    return fail(res, 409, ErrorCodes.VALIDATION_ERROR, 'This record already exists.');
  }

  // Sequelize model validation errors (e.g. isEmail, min, notEmpty)
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map((e) => e.message).join(', ');
    return fail(res, 400, ErrorCodes.VALIDATION_ERROR, message);
  }

  // Foreign key violation (e.g. referencing a giveawayId/prizeId that doesn't exist)
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return fail(res, 400, ErrorCodes.VALIDATION_ERROR, 'This request references something that no longer exists.');
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
