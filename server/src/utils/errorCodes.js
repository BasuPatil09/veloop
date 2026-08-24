/**
 * Central catalogue of API error codes. Controllers/services throw an ApiError
 * with one of these codes; the frontend maps codes to friendly copy instead of
 * parsing raw error strings (see architecture doc, section D).
 */
const ErrorCodes = Object.freeze({
  // Auth
  LOGIN_REQUIRED: 'LOGIN_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  FORBIDDEN: 'FORBIDDEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Giveaway lifecycle
  GIVEAWAY_NOT_FOUND: 'GIVEAWAY_NOT_FOUND',
  GIVEAWAY_NOT_ACTIVE: 'GIVEAWAY_NOT_ACTIVE',
  GIVEAWAY_ENDED: 'GIVEAWAY_ENDED',
  GIVEAWAY_UPCOMING: 'GIVEAWAY_UPCOMING',
  WINNER_SELECTION_NOT_ALLOWED: 'WINNER_SELECTION_NOT_ALLOWED',

  // Participation
  ALREADY_PARTICIPATING: 'ALREADY_PARTICIPATING',
  INSUFFICIENT_VE_BALANCE: 'INSUFFICIENT_VE_BALANCE',
  INSUFFICIENT_SVE_BALANCE: 'INSUFFICIENT_SVE_BALANCE',
  INSUFFICIENT_TOKEN_BALANCE: 'INSUFFICIENT_TOKEN_BALANCE',
  PARTICIPATION_BLOCKED: 'PARTICIPATION_BLOCKED',

  // Fraud / abuse
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  RATE_LIMITED: 'RATE_LIMITED',

  // Claim
  CLAIM_NOT_ALLOWED: 'CLAIM_NOT_ALLOWED',
  CLAIM_ALREADY_SUBMITTED: 'CLAIM_ALREADY_SUBMITTED',
  CLAIM_EXPIRED: 'CLAIM_EXPIRED',

  // Generic
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});

/** Error carrying an HTTP status + machine-readable code, thrown from services/controllers. */
class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message || code);
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = { ErrorCodes, ApiError };
