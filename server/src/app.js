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
const participationRoutes = require('./routes/participationRoutes');
const winnerRoutes = require('./routes/winnerRoutes');
const claimRoutes = require('./routes/claimRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Required behind any reverse proxy (Vercel, Render, etc.) — without this, req.ip
// resolves to the PROXY's IP for every request, not the real client's, which
// silently breaks IP-keyed rate limiting and makes every user's fraud
// deviceHash/ipHash identical (see services/fraudService.js, utils/deviceHash.js).
// Safe in plain local dev too: with no actual proxy in front, Express just falls
// back to the direct connection's address exactly as before.
app.set('trust proxy', 1);

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
app.use('/api/giveaways', participationRoutes);
app.use('/api/giveaways', winnerRoutes);
app.use('/api/giveaways', claimRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
