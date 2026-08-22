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
const { User, Giveaway, Prize } = require('../src/models');
const { signAccessToken } = require('../src/services/tokenService');

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  // Plain DELETE, not TRUNCATE — MySQL disallows TRUNCATE on any table referenced
  // by a foreign key, regardless of row count. Deleted child-to-parent order.
  await Prize.destroy({ where: {} });
  await Giveaway.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

async function createAdmin() {
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@example.com',
    passwordHash: 'not-checked-in-these-tests',
    role: 'admin',
  });
  return { admin, token: signAccessToken(admin) };
}

const samplePrize = {
  slug: 'iphone-15-pro',
  name: 'iPhone 15 Pro',
  type: 'PHYSICAL',
  claimType: 'PHYSICAL_ADDRESS',
  entryCurrency: 'VE',
  entryAmount: 250,
  winnerCount: 1,
};

function payload(overrides = {}) {
  const now = Date.now();
  return {
    title: 'Test Giveaway',
    slug: 'test-giveaway',
    description: 'A test giveaway',
    startAt: new Date(now - 60 * 1000).toISOString(), // started a minute ago -> active
    endAt: new Date(now + 24 * 60 * 60 * 1000).toISOString(), // ends in a day
    prizes: [samplePrize],
    ...overrides,
  };
}

describe('POST /api/admin/giveaways', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).post('/api/admin/giveaways').send(payload());
    expect(res.status).toBe(401);
  });

  it('rejects a non-admin user', async () => {
    const user = await User.create({ name: 'Regular', email: 'user@example.com', passwordHash: 'x', role: 'user' });
    const token = signAccessToken(user);

    const res = await request(app)
      .post('/api/admin/giveaways')
      .set('Authorization', `Bearer ${token}`)
      .send(payload());

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects a giveaway with no prizes', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/admin/giveaways')
      .set('Authorization', `Bearer ${token}`)
      .send(payload({ prizes: [] }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects endAt before startAt', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/admin/giveaways')
      .set('Authorization', `Bearer ${token}`)
      .send(payload({ startAt: '2026-06-10T00:00:00.000Z', endAt: '2026-06-01T00:00:00.000Z' }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates a giveaway with prizes and derives an active status from startAt/endAt', async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/admin/giveaways')
      .set('Authorization', `Bearer ${token}`)
      .send(payload());

    expect(res.status).toBe(201);
    expect(res.body.data.giveaway.status).toBe('active');
    expect(res.body.data.giveaway.prizes).toHaveLength(1);
    expect(res.body.data.giveaway.prizes[0]).toMatchObject({
      slug: 'iphone-15-pro',
      entryCurrency: 'VE',
      entryAmount: 250,
    });
  });

  it('derives an upcoming status when startAt is in the future', async () => {
    const { token } = await createAdmin();
    const now = Date.now();
    const res = await request(app)
      .post('/api/admin/giveaways')
      .set('Authorization', `Bearer ${token}`)
      .send(
        payload({
          startAt: new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString(),
          endAt: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      );

    expect(res.body.data.giveaway.status).toBe('upcoming');
  });

  it('rejects a duplicate giveaway slug', async () => {
    const { token } = await createAdmin();
    await request(app).post('/api/admin/giveaways').set('Authorization', `Bearer ${token}`).send(payload());

    const res = await request(app)
      .post('/api/admin/giveaways')
      .set('Authorization', `Bearer ${token}`)
      .send(payload({ prizes: [{ ...samplePrize, slug: 'a-different-prize-slug' }] }));

    expect(res.status).toBe(409);
  });

  it('rejects a duplicate prize slug even under a different giveaway', async () => {
    const { token } = await createAdmin();
    await request(app).post('/api/admin/giveaways').set('Authorization', `Bearer ${token}`).send(payload());

    const res = await request(app)
      .post('/api/admin/giveaways')
      .set('Authorization', `Bearer ${token}`)
      .send(payload({ slug: 'a-different-giveaway-slug' })); // same prize slug: 'iphone-15-pro'

    expect(res.status).toBe(409);
  });
});

describe('GET /api/giveaways/current', () => {
  it('returns an empty list when there are no giveaways (honest empty state, not fake data)', async () => {
    const res = await request(app).get('/api/giveaways/current');
    expect(res.status).toBe(200);
    expect(res.body.data.giveaways).toEqual([]);
  });

  it('returns active and upcoming giveaways but excludes ended ones', async () => {
    const { token } = await createAdmin();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const post = (body) =>
      request(app).post('/api/admin/giveaways').set('Authorization', `Bearer ${token}`).send(body);

    await post(payload({ slug: 'active-one', prizes: [{ ...samplePrize, slug: 'active-prize' }] }));
    await post(
      payload({
        slug: 'upcoming-one',
        prizes: [{ ...samplePrize, slug: 'upcoming-prize' }],
        startAt: new Date(now + 5 * day).toISOString(),
        endAt: new Date(now + 10 * day).toISOString(),
      }),
    );
    await post(
      payload({
        slug: 'ended-one',
        prizes: [{ ...samplePrize, slug: 'ended-prize' }],
        startAt: new Date(now - 10 * day).toISOString(),
        endAt: new Date(now - 5 * day).toISOString(),
      }),
    );

    const res = await request(app).get('/api/giveaways/current');
    const slugs = res.body.data.giveaways.map((g) => g.slug).sort();
    expect(slugs).toEqual(['active-one', 'upcoming-one']);
  });
});

describe('GET /api/giveaways/previous', () => {
  it('returns only ended/archived giveaways', async () => {
    const { token } = await createAdmin();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    await request(app)
      .post('/api/admin/giveaways')
      .set('Authorization', `Bearer ${token}`)
      .send(payload({ slug: 'active-one' }));
    await request(app)
      .post('/api/admin/giveaways')
      .set('Authorization', `Bearer ${token}`)
      .send(
        payload({
          slug: 'ended-one',
          prizes: [{ ...samplePrize, slug: 'ended-prize' }],
          startAt: new Date(now - 10 * day).toISOString(),
          endAt: new Date(now - 5 * day).toISOString(),
        }),
      );

    const res = await request(app).get('/api/giveaways/previous');
    expect(res.body.data.giveaways.map((g) => g.slug)).toEqual(['ended-one']);
  });
});

describe('GET /api/giveaways/slug/:slug (resolves against the PRIZE slug)', () => {
  it('returns 404 for an unknown slug', async () => {
    const res = await request(app).get('/api/giveaways/slug/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('GIVEAWAY_NOT_FOUND');
  });

  it('resolves a prize slug and returns both the prize and its parent giveaway', async () => {
    const { token } = await createAdmin();
    await request(app).post('/api/admin/giveaways').set('Authorization', `Bearer ${token}`).send(payload());

    const res = await request(app).get('/api/giveaways/slug/iphone-15-pro');
    expect(res.status).toBe(200);
    expect(res.body.data.prize.name).toBe('iPhone 15 Pro');
    expect(res.body.data.giveaway.slug).toBe('test-giveaway');
  });
});

describe('GET /api/giveaways/stats', () => {
  it('returns real counts, not placeholder data', async () => {
    const { token } = await createAdmin();
    await request(app).post('/api/admin/giveaways').set('Authorization', `Bearer ${token}`).send(payload());

    const res = await request(app).get('/api/giveaways/stats');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      totalGiveaways: 1,
      activeGiveaways: 1,
      totalParticipants: 0,
      prizesWon: 0,
    });
  });
});
