const request = require('supertest');

process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_NAME = process.env.DB_NAME || 'veloop_test';
process.env.DB_USER = process.env.DB_USER || 'veloop';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'veloop_dev_password';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || 'test-refresh-secret';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = require('../src/app');

describe('health check', () => {
  it('responds without needing auth or a live DB call', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });
});

describe('auth validation', () => {
  it('rejects register with an invalid email before touching the database', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'not-an-email', password: 'password1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects register with a too-short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects login with missing password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('protected routes', () => {
  it('rejects /me with no Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('LOGIN_REQUIRED');
  });

  it('rejects /me with a garbage token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('LOGIN_REQUIRED');
  });
});

describe('unknown routes', () => {
  it('returns a clean 404 envelope instead of an HTML error page', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('trust proxy', () => {
  it('is configured, so req.ip resolves from X-Forwarded-For behind a reverse proxy (Vercel/Render) instead of the proxy\u2019s own address', () => {
    expect(app.get('trust proxy')).toBe(1);
  });

  it('accepts requests carrying a forwarded-for header without erroring (express-rate-limit validates this strictly when a proxy is present)', async () => {
    const res = await request(app).get('/api/health').set('X-Forwarded-For', '203.0.113.42');
    expect(res.status).toBe(200);
  });
});
