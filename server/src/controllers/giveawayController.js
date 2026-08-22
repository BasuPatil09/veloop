const giveawayService = require('../services/giveawayService');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeGiveaway, serializePrizeWithGiveaway } = require('../utils/serializeGiveaway');
const { ApiError, ErrorCodes } = require('../utils/errorCodes');

const getCurrent = asyncHandler(async (req, res) => {
  const giveaways = await giveawayService.listCurrent();
  return ok(res, { giveaways: giveaways.map(serializeGiveaway) });
});

const getPrevious = asyncHandler(async (req, res) => {
  const giveaways = await giveawayService.listPrevious();
  return ok(res, { giveaways: giveaways.map(serializeGiveaway) });
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await giveawayService.getStats();
  return ok(res, stats);
});

const getBySlug = asyncHandler(async (req, res) => {
  const result = await giveawayService.getByPrizeSlug(req.params.slug);
  if (!result) {
    throw new ApiError(404, ErrorCodes.GIVEAWAY_NOT_FOUND, 'Giveaway not found.');
  }
  return ok(res, serializePrizeWithGiveaway(result.prize, result.giveaway));
});

const getById = asyncHandler(async (req, res) => {
  const giveaway = await giveawayService.getById(req.params.id);
  if (!giveaway) {
    throw new ApiError(404, ErrorCodes.GIVEAWAY_NOT_FOUND, 'Giveaway not found.');
  }
  return ok(res, { giveaway: serializeGiveaway(giveaway) });
});

module.exports = { getCurrent, getPrevious, getStats, getBySlug, getById };
