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
const {
  User,
  Giveaway,
  Prize,
  GiveawayParticipation,
  GiveawayEntryTransaction,
  GiveawayWinner,
  PrizeClaim,
} = require('../src/models');
const { signAccessToken } = require('../src/services/tokenService');

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await PrizeClaim.destroy({ where: {} });
  await GiveawayWinner.destroy({ where: {} });
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

let userCounter = 0;

async function createEndedGiveawayWithPrize({ winnerCount = 1 } = {}) {
  const { token: adminToken } = await createAdmin();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const res = await request(app)
    .post('/api/admin/giveaways')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Ended Giveaway',
      slug: 'ended-giveaway',
      startAt: new Date(now - 10 * day).toISOString(),
      endAt: new Date(now - 1 * day).toISOString(), // already ended
      prizes: [
        {
          slug: 'ended-prize',
          name: 'Test Prize',
          type: 'PHYSICAL',
          claimType: 'PHYSICAL_ADDRESS',
          entryCurrency: 'VE',
          entryAmount: 100,
          winnerCount,
        },
      ],
    });

  return { giveaway: res.body.data.giveaway, adminToken };
}

async function createActiveGiveawayWithPrize() {
  const { token: adminToken } = await createAdmin();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const res = await request(app)
    .post('/api/admin/giveaways')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Active Giveaway',
      slug: 'active-giveaway',
      startAt: new Date(now - 60 * 1000).toISOString(),
      endAt: new Date(now + day).toISOString(),
      prizes: [
        {
          slug: 'active-prize',
          name: 'Active Prize',
          type: 'PHYSICAL',
          claimType: 'PHYSICAL_ADDRESS',
          entryCurrency: 'VE',
          entryAmount: 100,
          winnerCount: 1,
        },
      ],
    });

  return { giveaway: res.body.data.giveaway, adminToken };
}

describe('POST /api/admin/giveaways/:id/select-winners', () => {
  it('rejects an unauthenticated request', async () => {
    const { giveaway } = await createEndedGiveawayWithPrize();
    const res = await request(app).post(`/api/admin/giveaways/${giveaway.id}/select-winners`);
    expect(res.status).toBe(401);
  });

  it('rejects a non-admin user', async () => {
    const { giveaway } = await createEndedGiveawayWithPrize();
    const user = await User.create({ name: 'Regular', email: 'reg@example.com', passwordHash: 'x', role: 'user' });
    const token = signAccessToken(user);

    const res = await request(app)
      .post(`/api/admin/giveaways/${giveaway.id}/select-winners`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('rejects selecting winners for a giveaway that has not ended', async () => {
    const { giveaway, adminToken } = await createActiveGiveawayWithPrize();
    const res = await request(app)
      .post(`/api/admin/giveaways/${giveaway.id}/select-winners`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('WINNER_SELECTION_NOT_ALLOWED');
  });

  it('selects exactly winnerCount winners from among real participants, no more', async () => {
    const { giveaway, adminToken } = await createEndedGiveawayWithPrize({ winnerCount: 2 });
    const prize = giveaway.prizes[0];

    // Can't join an already-ended giveaway through the normal flow — insert
    // participations directly to simulate people who joined while it was active.
    const joiners = [];
    for (let i = 0; i < 5; i += 1) {
      userCounter += 1;
      const user = await User.create({
        name: `Joiner ${userCounter}`,
        email: `joiner${userCounter}@example.com`,
        passwordHash: 'x',
        balanceVe: 0,
      });
      await GiveawayParticipation.create({
        userId: user.id,
        giveawayId: giveaway.id,
        prizeId: prize.id,
        entryCurrency: 'VE',
        entryAmount: 100,
        status: 'SUCCESS',
        joinedAt: new Date(),
      });
      joiners.push(user.id);
    }

    const res = await request(app)
      .post(`/api/admin/giveaways/${giveaway.id}/select-winners`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary[0].newlySelected).toBe(2);

    const winners = await GiveawayWinner.findAll({ where: { prizeId: prize.id } });
    expect(winners).toHaveLength(2);
    winners.forEach((w) => expect(joiners).toContain(w.userId));

    // A claim record should exist for each winner, ready to be filled in
    const claims = await PrizeClaim.findAll({ where: { prizeId: prize.id } });
    expect(claims).toHaveLength(2);
    expect(claims.every((c) => c.status === 'NOT_SUBMITTED')).toBe(true);
  });

  it('is idempotent — running it again does not create duplicate winners', async () => {
    const { giveaway, adminToken } = await createEndedGiveawayWithPrize({ winnerCount: 1 });
    const prize = giveaway.prizes[0];

    const user = await User.create({ name: 'Solo', email: 'solo@example.com', passwordHash: 'x' });
    await GiveawayParticipation.create({
      userId: user.id,
      giveawayId: giveaway.id,
      prizeId: prize.id,
      entryCurrency: 'VE',
      entryAmount: 100,
      status: 'SUCCESS',
      joinedAt: new Date(),
    });

    await request(app).post(`/api/admin/giveaways/${giveaway.id}/select-winners`).set('Authorization', `Bearer ${adminToken}`);
    const second = await request(app)
      .post(`/api/admin/giveaways/${giveaway.id}/select-winners`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(second.body.data.summary[0].alreadyComplete).toBe(true);
    expect(second.body.data.summary[0].newlySelected).toBe(0);

    const count = await GiveawayWinner.count({ where: { prizeId: prize.id } });
    expect(count).toBe(1);
  });
});

describe('GET /api/giveaways/:id/winners', () => {
  it('never reveals winners for an active giveaway', async () => {
    const { giveaway } = await createActiveGiveawayWithPrize();
    const res = await request(app).get(`/api/giveaways/${giveaway.id}/winners`);

    expect(res.status).toBe(200);
    expect(res.body.data.finalized).toBe(false);
    expect(res.body.data.winners).toEqual([]);
  });

  it('returns masked winner identities once finalized', async () => {
    const { giveaway, adminToken } = await createEndedGiveawayWithPrize();
    const prize = giveaway.prizes[0];
    const user = await User.create({ name: 'Winner Person', email: 'winner@example.com', passwordHash: 'x' });
    await GiveawayParticipation.create({
      userId: user.id,
      giveawayId: giveaway.id,
      prizeId: prize.id,
      entryCurrency: 'VE',
      entryAmount: 100,
      status: 'SUCCESS',
      joinedAt: new Date(),
    });

    await request(app).post(`/api/admin/giveaways/${giveaway.id}/select-winners`).set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app).get(`/api/giveaways/${giveaway.id}/winners`);
    expect(res.body.data.finalized).toBe(true);
    expect(res.body.data.winners).toHaveLength(1);
    expect(res.body.data.winners[0].maskedUserId).toMatch(/^VE\*+\d{2}$/);
    // never leak the real identity
    expect(JSON.stringify(res.body.data.winners[0])).not.toContain('winner@example.com');
    expect(JSON.stringify(res.body.data.winners[0])).not.toContain(user.id);
  });
});

describe('GET /api/giveaways/previous/winners', () => {
  it('includes winners from ended giveaways', async () => {
    const { giveaway, adminToken } = await createEndedGiveawayWithPrize();
    const prize = giveaway.prizes[0];
    const user = await User.create({ name: 'Someone', email: 'someone@example.com', passwordHash: 'x' });
    await GiveawayParticipation.create({
      userId: user.id,
      giveawayId: giveaway.id,
      prizeId: prize.id,
      entryCurrency: 'VE',
      entryAmount: 100,
      status: 'SUCCESS',
      joinedAt: new Date(),
    });
    await request(app).post(`/api/admin/giveaways/${giveaway.id}/select-winners`).set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app).get('/api/giveaways/previous/winners');
    expect(res.status).toBe(200);
    expect(res.body.data.winners.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.winners[0].giveawayTitle).toBe('Ended Giveaway');
  });
});
