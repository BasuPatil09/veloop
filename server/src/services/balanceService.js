const { ApiError } = require('../utils/errorCodes');
const { balanceFieldFor, insufficientBalanceCodeFor } = require('../utils/currencyFields');

/**
 * Checks and deducts a user's balance for the given currency, inside an existing
 * transaction. Must be called after the user row was loaded WITH a row lock
 * (SELECT ... FOR UPDATE) — see participationService.join — so two concurrent
 * requests can't both read the same starting balance and both succeed.
 */
async function deductBalance(user, currency, amount, transaction) {
  const field = balanceFieldFor(currency);
  const balanceBefore = user[field];

  if (balanceBefore < amount) {
    throw new ApiError(
      402,
      insufficientBalanceCodeFor(currency),
      `You don't have enough ${currency}s to join this giveaway.`,
    );
  }

  const balanceAfter = balanceBefore - amount;
  user[field] = balanceAfter;
  await user.save({ transaction });

  return { balanceBefore, balanceAfter };
}

module.exports = { deductBalance };
