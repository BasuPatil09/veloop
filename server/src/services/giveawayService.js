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

/**
 * IMPORTANT: list queries filter by TIME directly (startAt/endAt vs. now), not by
 * the stored `status` column. The stored column is kept fresh by a periodic sweep
 * (jobs/giveawayStatusSweep.js locally, or a scheduled endpoint on serverless
 * platforms where an in-process cron can't run) — but that sweep's frequency
 * varies by deployment platform (every 60s locally/Render, as infrequently as
 * once a day on some serverless free tiers). Filtering by time directly means
 * these lists are always correct regardless of how stale the stored column is;
 * the sweep becomes a nice-to-have for other consumers (e.g. admin dashboards
 * that query the raw column), never a correctness dependency.
 */
async function listCurrent() {
  const now = new Date();
  return Giveaway.findAll({
    where: {
      status: { [Op.ne]: 'archived' },
      endAt: { [Op.gt]: now }, // hasn't ended yet — covers both upcoming and active
    },
    include: [PRIZE_INCLUDE],
    order: [['startAt', 'ASC']],
  });
}

async function listPrevious() {
  const now = new Date();
  return Giveaway.findAll({
    where: {
      [Op.or]: [{ status: 'archived' }, { endAt: { [Op.lte]: now } }],
    },
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
  const now = new Date();
  const [totalGiveaways, activeGiveaways] = await Promise.all([
    Giveaway.count(),
    // Time-based, same reasoning as listCurrent/listPrevious above — never stale.
    Giveaway.count({
      where: { status: { [Op.ne]: 'archived' }, startAt: { [Op.lte]: now }, endAt: { [Op.gt]: now } },
    }),
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
 * Re-derives every non-archived giveaway's status and persists any drift. A
 * convenience/consistency sweep — NOT a correctness dependency, since every list
 * query and every write-path check re-derives live status independently. Safe to
 * call on any schedule (every minute via node-cron locally/Render, once a day via
 * Vercel Cron, or not at all).
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
