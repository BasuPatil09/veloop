const { sequelize, Giveaway, Prize } = require('../models');
const giveawayService = require('../services/giveawayService');
const winnerService = require('../services/winnerService');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeGiveaway } = require('../utils/serializeGiveaway');

const createGiveaway = asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    description,
    startAt,
    endAt,
    bannerImage,
    allowMultipleEntries,
    prizes,
  } = req.body;

  const created = await sequelize.transaction(async (t) => {
    const giveaway = await Giveaway.create(
      {
        title,
        slug,
        description: description || null,
        startAt,
        endAt,
        bannerImage: bannerImage || null,
        allowMultipleEntries: Boolean(allowMultipleEntries),
        // Derive the correct initial status immediately, rather than defaulting to
        // 'upcoming' and waiting up to 60s for the cron sweep to correct it.
        status: giveawayService.computeEffectiveStatus({ startAt, endAt, status: 'upcoming' }),
        createdById: req.user.id,
      },
      { transaction: t },
    );

    const prizeRows = prizes.map((prize, index) => ({
      giveawayId: giveaway.id,
      slug: prize.slug,
      name: prize.name,
      position: prize.position || null,
      image: prize.image || null,
      description: prize.description || null,
      type: prize.type,
      claimType: prize.claimType,
      entryCurrency: prize.entryCurrency,
      entryAmount: prize.entryAmount,
      winnerCount: prize.winnerCount || 1,
      value: prize.value || null,
      sortOrder: index,
    }));
    await Prize.bulkCreate(prizeRows, { transaction: t });

    return giveaway;
  });

  const full = await giveawayService.getById(created.id);
  return ok(res, { giveaway: serializeGiveaway(full) }, 201);
});

const selectWinners = asyncHandler(async (req, res) => {
  const summary = await winnerService.selectWinnersForGiveaway(req.params.id);
  return ok(res, { summary });
});

module.exports = { createGiveaway, selectWinners };
