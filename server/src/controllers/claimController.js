const claimService = require('../services/claimService');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeClaim } = require('../utils/serializeClaim');

const getMyClaim = asyncHandler(async (req, res) => {
  const result = await claimService.getMyClaim(req.user.id, req.params.prizeId);
  return ok(res, {
    isWinner: result.isWinner,
    winnersFinalized: result.winnersFinalized,
    winner: result.winner
      ? { status: result.winner.status, claimDeadline: result.winner.claimDeadline, selectedAt: result.winner.selectedAt }
      : null,
    claim: serializeClaim(result.claim),
  });
});

const submitClaim = asyncHandler(async (req, res) => {
  const claim = await claimService.submitClaim(req.user.id, req.params.prizeId, req.body);
  return ok(res, { claim: serializeClaim(claim) });
});

module.exports = { getMyClaim, submitClaim };
