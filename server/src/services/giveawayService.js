const { Op } = require('sequelize');
const { Giveaway, Prize } = require('../models');

const PRIZE_INCLUDE = { model: Prize, as: 'prizes', separate: true, order: [['sortOrder', 'ASC']] };

/**
 * Re-derives what a giveaway's status SHOULD be right now from startAt/endAt.
 * 'archived' is a manual, admin-only terminal state and is never auto-derived —
 * everything else (upcoming/active/ended) is purely a function of the clock.
 */
function computeEffectiveStatus(giveaway) {
  if (giveaway.status === 'archived') return 'archived';

  const now = Date.now();
  const startAt = new Date(giveaway.startAt).getTime();
  const endAt = new Date(giveaway.endAt).getTime();

  if (now < startAt) return 'upcoming';
  if (now < endAt) return 'active';
  return 'ended';
}

async function listCurrent() {
  return Giveaway.findAll({
    where: { status: { [Op.in]: ['active', 'upcoming'] } },
    include: [PRIZE_INCLUDE],
    order: [
      ['status', 'ASC'], // 'active' sorts before 'upcoming' alphabetically — active campaigns lead
      ['startAt', 'ASC'],
    ],
  });
}

async function listPrevious() {
  return Giveaway.findAll({
    where: { status: { [Op.in]: ['ended', 'archived'] } },
    include: [PRIZE_INCLUDE],
    order: [['endAt', 'DESC']],
  });
}

async function getById(id) {
  return Giveaway.findByPk(id, { include: [PRIZE_INCLUDE] });
}

async function getBySlug(slug) {
  return Giveaway.findOne({ where: { slug }, include: [PRIZE_INCLUDE] });
}

/**
 * Resolves /giveaway/:slug — which, per the "Entry scope" design decision, matches
 * against the PRIZE's slug (e.g. "iphone-15-pro"), not the parent campaign's slug.
 * Returns both the prize and its parent giveaway (shared countdown/status/rules).
 */
async function getByPrizeSlug(slug) {
  const prize = await Prize.findOne({ where: { slug }, include: [{ model: Giveaway, as: 'giveaway' }] });
  if (!prize) return null;
  return { prize, giveaway: prize.giveaway };
}

async function getStats() {
  const [totalGiveaways, activeGiveaways] = await Promise.all([
    Giveaway.count(),
    Giveaway.count({ where: { status: 'active' } }),
  ]);

  return {
    totalGiveaways,
    activeGiveaways,
    // Honest zeros, not placeholder numbers — Participation/Winner tables land in
    // Phases 3–4. Showing a fabricated count here would violate the spec's explicit
    // "no fake statistics" requirement (§60 of the frontend doc).
    totalParticipants: 0,
    prizesWon: 0,
  };
}

/**
 * Re-derives every non-archived giveaway's status and persists any drift. Called by
 * the cron sweep (jobs/giveawayStatusSweep.js) and safe to call on demand — this is a
 * consistency sweep, not the sole source of truth (every read/write path independently
 * re-checks time bounds too; see architecture doc, section H).
 */
async function syncStatuses() {
  const giveaways = await Giveaway.findAll({ where: { status: { [Op.ne]: 'archived' } } });

  await Promise.all(
    giveaways.map(async (giveaway) => {
      const effective = computeEffectiveStatus(giveaway);
      if (effective !== giveaway.status) {
        giveaway.status = effective;
        await giveaway.save();
      }
    }),
  );
}

module.exports = {
  computeEffectiveStatus,
  listCurrent,
  listPrevious,
  getById,
  getBySlug,
  getByPrizeSlug,
  getStats,
  syncStatuses,
};
