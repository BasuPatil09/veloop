const { GiveawayWinner, PrizeClaim, Prize } = require('../models');
const { ApiError, ErrorCodes } = require('../utils/errorCodes');

async function getMyClaim(userId, prizeId) {
  const winner = await GiveawayWinner.findOne({ where: { prizeId, userId } });
  if (!winner) return { isWinner: false, winner: null, claim: null };

  const claim = await PrizeClaim.findOne({ where: { winnerId: winner.id } });
  return { isWinner: true, winner, claim };
}

/**
 * Ownership is checked purely from the authenticated session (req.user.id, passed
 * in as userId) against the winner record's userId — never from anything the client
 * claims. A non-winner or a winner of a DIFFERENT prize gets the same 403.
 */
async function submitClaim(userId, prizeId, payload) {
  const winner = await GiveawayWinner.findOne({
    where: { prizeId, userId },
    include: [{ model: Prize, as: 'prize' }],
  });
  if (!winner) {
    throw new ApiError(403, ErrorCodes.CLAIM_NOT_ALLOWED, "This prize claim isn't available for your account.");
  }

  if (winner.claimDeadline && new Date() > new Date(winner.claimDeadline)) {
    throw new ApiError(409, ErrorCodes.CLAIM_EXPIRED, 'The claim window for this prize has expired.');
  }

  const claim = await PrizeClaim.findOne({ where: { winnerId: winner.id } });
  if (!claim) {
    throw new ApiError(404, ErrorCodes.NOT_FOUND, 'Claim record not found.');
  }
  if (claim.status !== 'NOT_SUBMITTED') {
    throw new ApiError(409, ErrorCodes.CLAIM_ALREADY_SUBMITTED, 'You have already submitted a claim for this prize.');
  }

  // The prize's claimType — not anything the client sends — determines which
  // fields are required. A gift-card winner can't submit a physical address
  // instead, and vice versa.
  const updates = { status: 'SUBMITTED', submittedAt: new Date() };

  if (winner.prize.claimType === 'EMAIL') {
    if (!payload.email) {
      throw new ApiError(400, ErrorCodes.VALIDATION_ERROR, 'Email is required.');
    }
    updates.email = payload.email;
  } else {
    const required = ['fullName', 'phone', 'address', 'city', 'state', 'pin'];
    const missing = required.filter((field) => !payload[field]);
    if (missing.length > 0) {
      throw new ApiError(400, ErrorCodes.VALIDATION_ERROR, `Missing required field(s): ${missing.join(', ')}.`);
    }
    required.forEach((field) => {
      updates[field] = payload[field];
    });
  }

  await claim.update(updates);
  return claim;
}

module.exports = { getMyClaim, submitClaim };
