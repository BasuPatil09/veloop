const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { env } = require('./config/env');
const { generalLimiter } = require('./middleware/rateLimitMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const { ok } = require('./utils/apiResponse');

const authRoutes = require('./routes/authRoutes');
const giveawayRoutes = require('./routes/giveawayRoutes');
const adminRoutes = require('./routes/adminRoutes');
// Phase 3+: participationRoutes, winnerRoutes, claimRoutes

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl, // exact allow-list — never cors('*') in production
    credentials: true, // required so the refresh-token cookie is sent/accepted
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(generalLimiter);

app.get('/api/health', (req, res) => ok(res, { status: 'ok', env: env.nodeEnv }));

app.use('/api/auth', authRoutes);
app.use('/api/giveaways', giveawayRoutes);
app.use('/api/admin', adminRoutes);
// Phase 3+: app.use('/api/giveaways', participationRoutes); etc.

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
