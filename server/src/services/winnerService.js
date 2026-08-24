const { Op } = require('sequelize');
const {
  sequelize,
  Giveaway,
  Prize,
  GiveawayParticipation,
  GiveawayWinner,
  PrizeClaim,
} = require('../models');
const giveawayService = require('./giveawayService');
const { ApiError, ErrorCodes } = require('../utils/errorCodes');

const CLAIM_WINDOW_DAYS = 7;

/** Fisher-Yates — avoids the bias and performance caveats of ORDER BY RAND() at any real scale. */
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Selects winners for every prize in a giveaway that hasn't reached its configured
 * winnerCount yet. Safe to call more than once — already-complete prizes are skipped,
 * so it never over-selects (spec §32/§33: exactly winnerCount winners per prize,
 * never more even if triggered repeatedly).
 */
async function selectWinnersForGiveaway(giveawayId) {
  const giveaway = await Giveaway.findByPk(giveawayId, { include: [{ model: Prize, as: 'prizes' }] });
  if (!giveaway) {
    throw new ApiError(404, ErrorCodes.GIVEAWAY_NOT_FOUND, 'Giveaway not found.');
  }

  const effectiveStatus = giveawayService.computeEffectiveStatus(giveaway);
  if (effectiveStatus !== 'ended' && effectiveStatus !== 'archived') {
    throw new ApiError(
      409,
      ErrorCodes.WINNER_SELECTION_NOT_ALLOWED,
      'Winners can only be selected after a giveaway has ended.',
    );
  }

  const summary = [];

  await sequelize.transaction(async (t) => {
    for (const prize of giveaway.prizes) {
      const existingWinners = await GiveawayWinner.findAll({ where: { prizeId: prize.id }, transaction: t });
      const alreadySelectedUserIds = new Set(existingWinners.map((w) => w.userId));
      const needed = prize.winnerCount - existingWinners.length;

      if (needed <= 0) {
        summary.push({ prizeId: prize.id, prizeName: prize.name, newlySelected: 0, alreadyComplete: true });
        continue;
      }

      const participations = await GiveawayParticipation.findAll({
        where: { prizeId: prize.id, status: 'SUCCESS' },
        transaction: t,
      });
      const eligible = participations.filter((p) => !alreadySelectedUserIds.has(p.userId));
      const chosen = shuffle(eligible).slice(0, needed);
      const claimDeadline = new Date(Date.now() + CLAIM_WINDOW_DAYS * 24 * 60 * 60 * 1000);

      for (const participation of chosen) {
        const winner = await GiveawayWinner.create(
          {
            giveawayId: giveaway.id,
            prizeId: prize.id,
            userId: participation.userId,
            selectionMethod: 'RANDOM',
            selectedAt: new Date(),
            status: 'PENDING_CLAIM',
            claimDeadline,
          },
          { transaction: t },
        );

        // Pre-create the claim record (NOT_SUBMITTED) so claim status is queryable
        // immediately, without a separate "first visit creates it" code path.
        await PrizeClaim.create(
          {
            winnerId: winner.id,
            userId: participation.userId,
            prizeId: prize.id,
            claimType: prize.claimType === 'EMAIL' ? 'EMAIL' : 'PHYSICAL',
            status: 'NOT_SUBMITTED',
          },
          { transaction: t },
        );
      }

      summary.push({
        prizeId: prize.id,
        prizeName: prize.name,
        newlySelected: chosen.length,
        alreadyComplete: false,
      });
    }
  });

  return summary;
}

/**
 * Never returns winners for a giveaway that's still active/upcoming — the spec is
 * explicit that an active giveaway must not falsely display current winners (§21).
 */
async function getWinnersForGiveaway(giveawayId) {
  const giveaway = await Giveaway.findByPk(giveawayId);
  if (!giveaway) {
    throw new ApiError(404, ErrorCodes.GIVEAWAY_NOT_FOUND, 'Giveaway not found.');
  }

  const effectiveStatus = giveawayService.computeEffectiveStatus(giveaway);
  if (effectiveStatus === 'active' || effectiveStatus === 'upcoming') {
    return { finalized: false, winners: [] };
  }

  const winners = await GiveawayWinner.findAll({
    where: { giveawayId },
    include: [
      { model: Prize, as: 'prize' },
      { model: Giveaway, as: 'giveaway' },
    ],
    order: [['selectedAt', 'DESC']],
  });

  return { finalized: true, winners };
}

/** Aggregated winners across all completed giveaways, for the Previous Winners tab / social-proof slider. */
async function getPreviousWinners(limit = 50) {
  return GiveawayWinner.findAll({
    include: [
      { model: Prize, as: 'prize' },
      { model: Giveaway, as: 'giveaway', where: { status: { [Op.in]: ['ended', 'archived'] } } },
    ],
    order: [['selectedAt', 'DESC']],
    limit,
  });
}

module.exports = { selectWinnersForGiveaway, getWinnersForGiveaway, getPreviousWinners };
