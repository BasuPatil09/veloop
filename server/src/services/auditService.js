const { AuditLog } = require('../models');

/**
 * Best-effort logging — an audit-log failure must never break the primary
 * user-facing operation it's recording, so failures are swallowed (and logged
 * server-side) rather than propagated.
 */
async function log({ userId, action, giveawayId, amount, currency, result, requestId, meta }) {
  try {
    await AuditLog.create({ userId, action, giveawayId, amount, currency, result, requestId, meta });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] failed to write log entry:', err.message);
  }
}

module.exports = { log };
