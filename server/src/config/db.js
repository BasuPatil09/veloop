const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');
const { env } = require('./env');

const isServerless = Boolean(process.env.VERCEL);

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  dialectModule: mysql2,
  logging: false,

  dialectOptions: env.db.ssl
    ? {
        ssl: env.db.sslCa
          ? {
              rejectUnauthorized: true,
              ca: env.db.sslCa,
            }
          : {
              rejectUnauthorized: true,
            },
      }
    : {},

  pool: isServerless
    ? {
        max: 2,
        min: 0,
        idle: 10000,
        acquire: 30000,
      }
    : {
        max: 10,
        min: 0,
        idle: 10000,
        acquire: 30000,
      },

  define: {
    freezeTableName: false,
  },
});

async function connectDB() {
  try {
    await sequelize.authenticate();

    console.log(
      `[db] connected — ${env.db.name}@${env.db.host}:${env.db.port}`
    );

    if (env.nodeEnv !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('[db] schema synced (development mode)');
    }
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };