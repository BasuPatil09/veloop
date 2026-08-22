const cron = require('node-cron');
const giveawayService = require('../services/giveawayService');

/**
 * Consistency sweep, not the sole source of truth — every read/write path also
 * independently re-derives status from startAt/endAt (architecture doc, section H).
 * This just keeps the stored `status` column from drifting for more than ~60s.
 */
function startGiveawayStatusSweep() {
  cron.schedule('* * * * *', async () => {
    try {
      await giveawayService.syncStatuses();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[giveawayStatusSweep] failed:', err.message);
    }
  });
}

module.exports = { startGiveawayStatusSweep };
