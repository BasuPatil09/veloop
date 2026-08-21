const { validationResult } = require('express-validator');
const { ApiError, ErrorCodes } = require('../utils/errorCodes');

/** Runs an array of express-validator checks, then rejects with a single readable message if any failed. */
function validate(validators) {
  return async (req, res, next) => {
    try {
      await Promise.all(validators.map((validator) => validator.run(req)));

      const result = validationResult(req);
      if (result.isEmpty()) return next();

      const message = result.array({ onlyFirstError: true }).map((e) => e.msg).join(', ');
      return next(new ApiError(400, ErrorCodes.VALIDATION_ERROR, message));
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { validate };
