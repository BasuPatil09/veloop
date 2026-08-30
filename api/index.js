// Vercel serverless entry point for the entire API.
//
// Deliberately does NOT call the traditional server.js startup sequence
// (connectDB + sync + process.exit-on-failure + starting the in-process cron).
// Those are all wrong for a serverless function:
//   - Sequelize connects lazily on first query — no explicit connect step needed.
//   - sequelize.sync({ alter: true }) running on every cold start (potentially many
//     concurrent ones) risks concurrent ALTER TABLE races; production never syncs
//     anyway (see server/src/config/db.js), so this only matters for the one-time
//     schema-creation step documented in DEPLOYMENT.md.
//   - process.exit(1) inside a function handler would kill the whole invocation
//     abruptly instead of returning a clean error response.
//   - The in-process node-cron job can't run here at all — see api/cron/status-sweep.js
//     for the Vercel Cron equivalent.
//
// The Express app itself (server/src/app.js) is unchanged and shared by both this
// serverless entry point and the traditional server.js (local dev / Render).
const app = require('../server/src/app');

module.exports = app;
