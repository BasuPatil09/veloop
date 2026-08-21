const mongoose = require('mongoose');
const { env } = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.mongoUri);
    // eslint-disable-next-line no-console
    console.log(`[db] connected — ${mongoose.connection.name}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('[db] disconnected');
  });
}

module.exports = { connectDB };
