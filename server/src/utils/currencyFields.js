const { ErrorCodes } = require('./errorCodes');

/**
 * Single source of truth for currency -> DB column / error code mapping.
 * Every balance check anywhere in the app goes through this — never an
 * `if (currency === 'VE')` scattered across controllers/services (spec §11, §69).
 */
const CURRENCY_TO_BALANCE_FIELD = {
  VE: 'balanceVe',
  SVE: 'balanceSve',
  TOKEN: 'balanceToken',
};

const CURRENCY_TO_INSUFFICIENT_CODE = {
  VE: ErrorCodes.INSUFFICIENT_VE_BALANCE,
  SVE: ErrorCodes.INSUFFICIENT_SVE_BALANCE,
  TOKEN: ErrorCodes.INSUFFICIENT_TOKEN_BALANCE,
};

function balanceFieldFor(currency) {
  return CURRENCY_TO_BALANCE_FIELD[currency];
}

function insufficientBalanceCodeFor(currency) {
  return CURRENCY_TO_INSUFFICIENT_CODE[currency];
}

module.exports = { balanceFieldFor, insufficientBalanceCodeFor };
