const { Op } = require('sequelize');
const { GiveawayParticipation } = require('../models');

// Tunable weights, not magic numbers scattered through the codebase.
const RISK_THRESHOLDS = { MEDIUM: 60, HIGH: 80 };
const DEVICE_REUSE_WEIGHT = 15; // per additional distinct user sharing this device
const DEVICE_REUSE_CAP = 60;
const RAPID_ATTEMPT_WEIGHT = 25;
const RAPID_ATTEMPT_WINDOW_MS = 60 * 1000;
const RAPID_ATTEMPT_THRESHOLD = 3;

/**
 * Scores a join attempt from 0-100. Device fingerprinting is an abuse-prevention
 * SIGNAL, not an identity lock — legitimate users share networks/devices too, so
 * a single signal only ever pushes the score into FLAGGED, never BLOCKED alone
 * (spec §21/§24-26: no single signal is definitive proof).
 */
async function scoreJoinAttempt({ userId, deviceHash }) {
  const signals = [];
  let score = 0;

  if (deviceHash) {
    const distinctUsersOnDevice = await GiveawayParticipation.count({
      distinct: true,
      col: 'userId',
      where: { deviceHash, userId: { [Op.ne]: userId } },
    });
    if (distinctUsersOnDevice > 0) {
      score += Math.min(distinctUsersOnDevice * DEVICE_REUSE_WEIGHT, DEVICE_REUSE_CAP);
      signals.push(`device_shared_with_${distinctUsersOnDevice}_other_account(s)`);
    }
  }

  const recentAttempts = await GiveawayParticipation.count({
    where: { userId, createdAt: { [Op.gte]: new Date(Date.now() - RAPID_ATTEMPT_WINDOW_MS) } },
  });
  if (recentAttempts >= RAPID_ATTEMPT_THRESHOLD) {
    score += RAPID_ATTEMPT_WEIGHT;
    signals.push('high_request_velocity');
  }

  score = Math.min(score, 100);

  let action = 'ALLOWED';
  if (score >= RISK_THRESHOLDS.HIGH) action = 'BLOCKED';
  else if (score >= RISK_THRESHOLDS.MEDIUM) action = 'FLAGGED';

  return { score, signals, action };
}

module.exports = { scoreJoinAttempt, RISK_THRESHOLDS };
