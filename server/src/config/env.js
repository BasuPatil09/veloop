const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const required = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'JWT_SECRET',
  'REFRESH_SECRET',
  'CLIENT_URL',
];

// Fail fast in any environment other than a plain syntax check — a misconfigured
// secret is a security incident waiting to happen, not something to default around.
function assertRequiredEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    // Optional — most managed MySQL hosts (including TiDB Cloud, which uses a
    // Let's Encrypt-issued cert already trusted by Node's default CA bundle) work
    // fine without this. Set it only if a provider specifically requires pinning
    // their own CA certificate (paste the full PEM contents as the env var value).
    sslCa: process.env.DB_SSL_CA || null,
  },
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret: process.env.REFRESH_SECRET,
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || '7d',
  refreshExpiresInMs: 7 * 24 * 60 * 60 * 1000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieSecret: process.env.COOKIE_SECRET || 'dev-cookie-secret',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
};

module.exports = { env, assertRequiredEnv };
