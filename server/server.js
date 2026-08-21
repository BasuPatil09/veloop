const { assertRequiredEnv, env } = require('./src/config/env');

assertRequiredEnv();

const { connectDB } = require('./src/config/db');
const app = require('./src/app');

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] VELOOP Giveaway API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start();
