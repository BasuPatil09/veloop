const request = require('supertest');

process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_NAME = process.env.DB_NAME || 'veloop_test';
process.env.DB_USER = process.env.DB_USER || 'veloop';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'veloop_dev_password';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || 'test-refresh-secret';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = require('../src/app');
const { sequelize } = require('../src/config/db');
const User = require('../src/models/User');

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true }); // clean schema for the test DB on every run
});

afterEach(async () => {
  // Plain DELETE, not TRUNCATE — MySQL disallows TRUNCATE on any table referenced
  // by a foreign key (giveaways.createdById -> users.id), regardless of row count.
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

const validUser = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'password1' };

describe('POST /api/auth/register', () => {
  it('creates a user, hashes the password, and returns an access token', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('ada@example.com');
    expect(res.body.data.user.balances).toEqual({ ve: 0, sve: 0, token: 0 });
    // never leak the hash or the raw password back to the client
    expect(res.body.data.user.passwordHash).toBeUndefined();

    const stored = await User.scope('withSecrets').findOne({ where: { email: 'ada@example.com' } });
    expect(stored.passwordHash).not.toBe(validUser.password);

    // sets the httpOnly refresh cookie
    const setCookie = res.headers['set-cookie'] || [];
    expect(setCookie.some((c) => c.startsWith('veloop_refresh_token='))).toBe(true);
  });

  it('rejects a second registration with the same email', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');
  });

  it('lowercases email on write so login is case-insensitive', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'Ada@Example.com' });

    const stored = await User.findOne({ where: { email: 'ada@example.com' } });
    expect(stored).not.toBeNull();
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validUser);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.name).toBe('Ada Lovelace');
  });

  it('rejects an incorrect password without revealing which field was wrong', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects a login for an email that was never registered', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password1' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid access token', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(validUser);
    const { accessToken } = registerRes.body.data;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
  });
});

describe('full session lifecycle: register → refresh → logout → refresh fails', () => {
  it('rotates the access token via the refresh cookie, then revokes it on logout', async () => {
    const agent = request.agent(app); // persists cookies across requests, like a browser

    const registerRes = await agent.post('/api/auth/register').send(validUser);
    const firstAccessToken = registerRes.body.data.accessToken;

    const refreshRes = await agent.post('/api/auth/refresh');
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toEqual(expect.any(String));
    expect(refreshRes.body.data.accessToken).not.toBe(firstAccessToken); // token was rotated

    const logoutRes = await agent
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${refreshRes.body.data.accessToken}`);
    expect(logoutRes.status).toBe(200);

    // the refresh cookie was cleared by logout — no cookie is sent at all now
    const secondRefreshRes = await agent.post('/api/auth/refresh');
    expect(secondRefreshRes.status).toBe(401);
    expect(secondRefreshRes.body.error.code).toBe('LOGIN_REQUIRED');
  });

  it('rejects a replayed pre-logout refresh token even if an attacker captured the cookie', async () => {
    const agent = request.agent(app);

    const registerRes = await agent.post('/api/auth/register').send(validUser);
    const capturedCookie = registerRes.headers['set-cookie'].find((c) => c.startsWith('veloop_refresh_token='));

    await agent
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${registerRes.body.data.accessToken}`);

    // Replay the captured pre-logout cookie manually on a fresh request (not through
    // the agent, whose cookie jar was already cleared) — the DB-side hash was revoked
    // on logout, so this must fail even though the JWT signature itself is still valid.
    const replayRes = await request(app).post('/api/auth/refresh').set('Cookie', capturedCookie);

    expect(replayRes.status).toBe(401);
    expect(replayRes.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });
});
