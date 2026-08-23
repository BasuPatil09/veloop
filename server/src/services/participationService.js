const { sequelize, User, Giveaway, Prize, GiveawayParticipation, GiveawayEntryTransaction } = require('../models');
const giveawayService = require('./giveawayService');
const balanceService = require('./balanceService');
const { ApiError, ErrorCodes } = require('../utils/errorCodes');

async function getMyStatus(userId, prizeId) {
  const participation = await GiveawayParticipation.findOne({ where: { userId, prizeId } });
  return { joined: Boolean(participation), participation };
}

/**
 * Returns the existing successful transaction+participation for this idempotency
 * key, if one exists — lets a client retry (e.g. after a network timeout) safely
 * replay the SAME request and get the SAME result instead of being charged twice.
 */
async function findReplay(userId, idempotencyKey) {
  if (!idempotencyKey) return null;

  const transaction = await GiveawayEntryTransaction.findOne({
    where: { idempotencyKey, userId, status: 'SUCCESS' },
  });
  if (!transaction) return null;

  const participation = await GiveawayParticipation.findOne({ where: { transactionId: transaction.id } });
  return { participation, transaction };
}

/**
 * The guarded join flow (architecture doc, section I). The frontend sends only
 * { idempotencyKey } — everything else (currency, fee, giveaway status, identity)
 * is independently re-derived here. Nothing from the request body is trusted for
 * the actual charge.
 */
async function join(userId, prizeId, { idempotencyKey, deviceHash, ipHash } = {}) {
  const replay = await findReplay(userId, idempotencyKey);
  if (replay) return { ...replay, replayed: true };

  const prize = await Prize.findByPk(prizeId, { include: [{ model: Giveaway, as: 'giveaway' }] });
  if (!prize || !prize.giveaway) {
    throw new ApiError(404, ErrorCodes.GIVEAWAY_NOT_FOUND, 'Giveaway not found.');
  }
  const { giveaway } = prize;

  // Re-derive status from the clock — never trust the stored column alone, and
  // certainly never trust anything the client claims about giveaway state.
  const effectiveStatus = giveawayService.computeEffectiveStatus(giveaway);
  if (effectiveStatus === 'upcoming') {
    throw new ApiError(409, ErrorCodes.GIVEAWAY_UPCOMING, 'This giveaway has not started yet.');
  }
  if (effectiveStatus === 'ended' || effectiveStatus === 'archived') {
    throw new ApiError(409, ErrorCodes.GIVEAWAY_ENDED, 'This giveaway has ended.');
  }

  // Fast-fail pre-check (friendly error in the common case). The DB's unique
  // index on (userId, prizeId) is the real guarantee for the concurrent-request
  // race — see the catch block below.
  const existing = await GiveawayParticipation.findOne({ where: { userId, prizeId } });
  if (existing) {
    throw new ApiError(409, ErrorCodes.ALREADY_PARTICIPATING, "You're already participating in this giveaway.");
  }

  try {
    return await sequelize.transaction(async (t) => {
      // Row-locked read (SELECT ... FOR UPDATE) so two concurrent requests for the
      // same user can't both read the same starting balance and both succeed.
      const user = await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });

      const { balanceBefore, balanceAfter } = await balanceService.deductBalance(
        user,
        prize.entryCurrency,
        prize.entryAmount,
        t,
      );

      const entryTransaction = await GiveawayEntryTransaction.create(
        {
          userId,
          giveawayId: giveaway.id,
          prizeId: prize.id,
          currency: prize.entryCurrency,
          amount: prize.entryAmount,
          type: 'ENTRY_FEE',
          status: 'SUCCESS',
          balanceBefore,
          balanceAfter,
          idempotencyKey: idempotencyKey || null,
        },
        { transaction: t },
      );

      const participation = await GiveawayParticipation.create(
        {
          userId,
          giveawayId: giveaway.id,
          prizeId: prize.id,
          entryCurrency: prize.entryCurrency,
          entryAmount: prize.entryAmount,
          deviceHash,
          ipHash,
          status: 'SUCCESS',
          transactionId: entryTransaction.id,
          joinedAt: new Date(),
        },
        { transaction: t },
      );

      return { participation, transaction: entryTransaction, replayed: false };
    });
  } catch (err) {
    // The pre-check above misses a genuine race (two simultaneous requests both
    // passing it before either commits) — the DB constraint still catches it, we
    // just translate the raw Sequelize error into the same friendly code.
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw new ApiError(409, ErrorCodes.ALREADY_PARTICIPATING, "You're already participating in this giveaway.");
    }
    throw err;
  }
}

module.exports = { getMyStatus, join };
