const FRIENDLY_MESSAGES = {
  LOGIN_REQUIRED: 'Please log in to continue.',
  INVALID_CREDENTIALS: 'Incorrect email or password.',
  EMAIL_ALREADY_REGISTERED: 'An account with this email already exists.',
  VALIDATION_ERROR: null, // backend message is already user-facing for validation
  GIVEAWAY_ENDED: 'This giveaway has ended. Check out the winners and get ready for the next one.',
  GIVEAWAY_NOT_ACTIVE: 'This giveaway is not open for entries right now.',
  ALREADY_PARTICIPATING: "You're already participating in this giveaway.",
  INSUFFICIENT_VE_BALANCE: "You don't have enough VEs to join this giveaway.",
  INSUFFICIENT_SVE_BALANCE: "You don't have enough SVEs to join this giveaway.",
  INSUFFICIENT_TOKEN_BALANCE: "You don't have enough Tokens to join this giveaway.",
  SUSPICIOUS_ACTIVITY:
    "We couldn't verify this request. Please try again later or contact support if this seems wrong.",
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
  CLAIM_NOT_ALLOWED: "This prize claim isn't available for your account.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  INTERNAL_ERROR: 'Something went wrong on our end. Please try again.',
};

/** Extracts a user-safe message from an axios/API error, falling back to a generic message. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const apiError = error?.response?.data?.error;
  if (!apiError) return fallback;

  const mapped = FRIENDLY_MESSAGES[apiError.code];
  if (mapped) return mapped;
  return apiError.message || fallback;
}
