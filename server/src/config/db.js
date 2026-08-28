const { Sequelize } = require('sequelize');
const { env } = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: false,
  // Managed MySQL hosts (Aiven, PlanetScale, etc.) require TLS and reject plain
  // connections outright. Local MySQL/MariaDB doesn't need this, so it's opt-in
  // via DB_SSL rather than always-on.
  dialectOptions: env.db.ssl ? { ssl: { rejectUnauthorized: true } } : {},
  define: {
    // Sequelize default is snake_case table names off / camelCase columns on — we keep
    // camelCase columns to match the JS models 1:1, same convention the Mongoose schemas used.
    freezeTableName: false,
  },
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    // eslint-disable-next-line no-console
    console.log(`[db] connected — ${env.db.name}@${env.db.host}:${env.db.port}`);

    if (env.nodeEnv !== 'production') {
      // Dev convenience: keep tables in sync with the models without a manual migration
      // step. Production deployments should switch to sequelize-cli migrations instead
      // of relying on sync() against a live database.
      await sequelize.sync({ alter: true });
      // eslint-disable-next-line no-console
      console.log('[db] schema synced (development mode)');
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
