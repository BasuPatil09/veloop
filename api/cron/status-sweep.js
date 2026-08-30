// Vercel Cron target — invoked on a schedule (see vercel.json's "crons" entry).
// On the Hobby plan this can only run once a day at most (an hourly/per-minute
// expression is rejected at deploy time). That's fine here specifically because
// giveawayService.listCurrent/listPrevious and every serializer already compute
// live status from the clock rather than trusting this stored column — this sweep
// is pure housekeeping (keeps the raw DB column tidy for anyone querying it
// directly), never a correctness dependency.
const giveawayService = require('../../server/src/services/giveawayService');

module.exports = async (req, res) => {
  // Vercel automatically sends this header on real cron invocations and provisions
  // CRON_SECRET in the project's environment — this stops anyone else from hitting
  // the public URL and triggering it directly.
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } });
    return;
  }

  try {
    await giveawayService.syncStatuses();
    res.status(200).json({ success: true, data: { swept: true } });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[cron:status-sweep] failed:', err.message);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Sweep failed.' } });
  }
};
