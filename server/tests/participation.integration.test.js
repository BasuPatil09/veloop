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
const { User, Giveaway, Prize, GiveawayParticipation, GiveawayEntryTransaction } = require('../src/models');
const { signAccessToken } = require('../src/services/tokenService');

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await GiveawayEntryTransaction.destroy({ where: {} });
  await GiveawayParticipation.destroy({ where: {} });
  await Prize.destroy({ where: {} });
  await Giveaway.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

async function createAdmin() {
  const admin = await User.create({ name: 'Admin', email: 'admin@example.com', passwordHash: 'x', role: 'admin' });
  return { admin, token: signAccessToken(admin) };
}

async function createUser(balances = {}) {
  const user = await User.create({
    name: 'Player One',
    email: 'player@example.com',
    passwordHash: 'x',
    role: 'user',
    balanceVe: balances.ve ?? 0,
    balanceSve: balances.sve ?? 0,
    balanceToken: balances.token ?? 0,
  });
  return { user, token: signAccessToken(user) };
}

async function createGiveawayWithPrize(overrides = {}) {
  const { token } = await createAdmin();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const res = await request(app)
    .post('/api/admin/giveaways')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Test Giveaway',
      slug: 'test-giveaway',
      startAt: new Date(now - 60 * 1000).toISOString(),
      endAt: new Date(now + day).toISOString(),
      prizes: [
        {
          slug: 'iphone-15-pro',
          name: 'iPhone 15 Pro',
          type: 'PHYSICAL',
          claimType: 'PHYSICAL_ADDRESS',
          entryCurrency: 'VE',
          entryAmount: 250,
          winnerCount: 1,
        },
      ],
      ...overrides,
    });

  return res.body.data.giveaway;
}

describe('POST /api/giveaways/:prizeId/join', () => {
  it('rejects an unauthenticated request', async () => {
    const giveaway = await createGiveawayWithPrize();
    const res = await request(app).post(`/api/giveaways/${giveaway.prizes[0].id}/join`).send({});
    expect(res.status).toBe(401);
  });

  it('rejects insufficient balance and leaves the balance untouched', async () => {
    const giveaway = await createGiveawayWithPrize();
    const { user, token } = await createUser({ ve: 100 }); // prize costs 250 VE

    const res = await request(app)
      .post(`/api/giveaways/${giveaway.prizes[0].id}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(402);
    expect(res.body.error.code).toBe('INSUFFICIENT_VE_BALANCE');

    const fresh = await User.findByPk(user.id);
    expect(fresh.balanceVe).toBe(100); // unchanged — no partial deduction
  });

  it('joins successfully, deducts the correct currency/amount, and records the transaction', async () => {
    const giveaway = await createGiveawayWithPrize();
    const { user, token } = await createUser({ ve: 850 });

    const res = await request(app)
      .post(`/api/giveaways/${giveaway.prizes[0].id}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.data.participation.entryCurrency).toBe('VE');
    expect(res.body.data.participation.entryAmount).toBe(250);
    expect(res.body.data.transaction.balanceBefore).toBe(850);
    expect(res.body.data.transaction.balanceAfter).toBe(600);

    const fresh = await User.findByPk(user.id);
    expect(fresh.balanceVe).toBe(600);
  });

  it('ignores a client-supplied amount/currency and charges the prize-defined fee instead', async () => {
    const giveaway = await createGiveawayWithPrize();
    const { user, token } = await createUser({ ve: 850 });

    const res = await request(app)
      .post(`/api/giveaways/${giveaway.prizes[0].id}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1, currency: 'TOKEN', userId: 'someone-elses-id' }); // all should be ignored

    expect(res.status).toBe(201);
    expect(res.body.data.transaction.amount).toBe(250);
    expect(res.body.data.transaction.currency).toBe('VE');

    const fresh = await User.findByPk(user.id);
    expect(fresh.balanceVe).toBe(600); // charged the real 250 VE fee, not the claimed amount=1
  });

  it('rejects a second join for the same user+prize', async () => {
    const giveaway = await createGiveawayWithPrize();
    const { token } = await createUser({ ve: 850 });

    await request(app)
      .post(`/api/giveaways/${giveaway.prizes[0].id}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    const res = await request(app)
      .post(`/api/giveaways/${giveaway.prizes[0].id}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_PARTICIPATING');

    const count = await GiveawayParticipation.count();
    expect(count).toBe(1); // no duplicate row, no double deduction
  });

  it('rejects joining an ended giveaway', async () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const giveaway = await createGiveawayWithPrize({
      startAt: new Date(now - 10 * day).toISOString(),
      endAt: new Date(now - 5 * day).toISOString(),
    });
    const { token } = await createUser({ ve: 850 });

    const res = await request(app)
      .post(`/api/giveaways/${giveaway.prizes[0].id}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('GIVEAWAY_ENDED');
  });

  it('rejects joining an upcoming giveaway', async () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const giveaway = await createGiveawayWithPrize({
      startAt: new Date(now + 5 * day).toISOString(),
      endAt: new Date(now + 10 * day).toISOString(),
    });
    const { token } = await createUser({ ve: 850 });

    const res = await request(app)
      .post(`/api/giveaways/${giveaway.prizes[0].id}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('GIVEAWAY_UPCOMING');
  });

  it('returns 404 for a prize that does not exist', async () => {
    const { token } = await createUser({ ve: 850 });
    const res = await request(app)
      .post('/api/giveaways/00000000-0000-0000-0000-000000000000/join')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('GIVEAWAY_NOT_FOUND');
  });

  it('replays the same result for a repeated idempotency key instead of charging twice', async () => {
    const giveaway = await createGiveawayWithPrize();
    const { user, token } = await createUser({ ve: 850 });
    const idempotencyKey = 'test-idempotency-key-123';

    const first = await request(app)
      .post(`/api/giveaways/${giveaway.prizes[0].id}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({ idempotencyKey });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/giveaways/${giveaway.prizes[0].id}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({ idempotencyKey });
    expect(second.status).toBe(200); // replayed, not a fresh 201
    expect(second.body.data.participation.id).toBe(first.body.data.participation.id);

    const fresh = await User.findByPk(user.id);
    expect(fresh.balanceVe).toBe(600); // only charged once despite two requests
    expect(await GiveawayEntryTransaction.count()).toBe(1);
  });
});

describe('GET /api/giveaways/:prizeId/my-status', () => {
  it('reports not joined before joining, and joined after', async () => {
    const giveaway = await createGiveawayWithPrize();
    const { token } = await createUser({ ve: 850 });
    const prizeId = giveaway.prizes[0].id;

    const before = await request(app).get(`/api/giveaways/${prizeId}/my-status`).set('Authorization', `Bearer ${token}`);
    expect(before.body.data.joined).toBe(false);

    await request(app).post(`/api/giveaways/${prizeId}/join`).set('Authorization', `Bearer ${token}`).send({});

    const after = await request(app).get(`/api/giveaways/${prizeId}/my-status`).set('Authorization', `Bearer ${token}`);
    expect(after.body.data.joined).toBe(true);
    expect(after.body.data.participation.entryAmount).toBe(250);
  });

  it('rejects an unauthenticated request', async () => {
    const giveaway = await createGiveawayWithPrize();
    const res = await request(app).get(`/api/giveaways/${giveaway.prizes[0].id}/my-status`);
    expect(res.status).toBe(401);
  });
});
