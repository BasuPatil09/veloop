const winnerService = require('../services/winnerService');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeWinner } = require('../utils/serializeWinner');

const getWinnersForGiveaway = asyncHandler(async (req, res) => {
  const result = await winnerService.getWinnersForGiveaway(req.params.id);
  return ok(res, { finalized: result.finalized, winners: result.winners.map(serializeWinner) });
});

const getPreviousWinners = asyncHandler(async (req, res) => {
  const winners = await winnerService.getPreviousWinners();
  return ok(res, { winners: winners.map(serializeWinner) });
});

module.exports = { getWinnersForGiveaway, getPreviousWinners };
