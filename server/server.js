const { assertRequiredEnv, env } = require('./src/config/env');

assertRequiredEnv();

const { connectDB } = require('./src/config/db');
const app = require('./src/app');
const { startGiveawayStatusSweep } = require('./src/jobs/giveawayStatusSweep');

async function start() {
  await connectDB();
  startGiveawayStatusSweep();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] VELOOP Giveaway API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start();
