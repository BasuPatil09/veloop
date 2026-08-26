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
const { User, Giveaway, Prize, GiveawayWinner, PrizeClaim } = require('../src/models');
const { signAccessToken } = require('../src/services/tokenService');

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await PrizeClaim.destroy({ where: {} });
  await GiveawayWinner.destroy({ where: {} });
  await Prize.destroy({ where: {} });
  await Giveaway.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

let counter = 0;
async function createUser() {
  counter += 1;
  const user = await User.create({ name: `User ${counter}`, email: `user${counter}@example.com`, passwordHash: 'x' });
  return { user, token: signAccessToken(user) };
}

async function createGiveawayAndPrize({ claimType = 'PHYSICAL_ADDRESS' } = {}) {
  const giveaway = await Giveaway.create({
    title: 'Ended Giveaway',
    slug: `ended-${Date.now()}-${Math.random()}`,
    status: 'ended',
    startAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    endAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  });
  const prize = await Prize.create({
    giveawayId: giveaway.id,
    slug: `prize-${Date.now()}-${Math.random()}`,
    name: 'Test Prize',
    type: claimType === 'EMAIL' ? 'GIFT_CARD' : 'PHYSICAL',
    claimType,
    entryCurrency: 'VE',
    entryAmount: 100,
    winnerCount: 1,
  });
  return { giveaway, prize };
}

async function makeWinner(user, prize, giveaway, { claimDeadline } = {}) {
  const winner = await GiveawayWinner.create({
    giveawayId: giveaway.id,
    prizeId: prize.id,
    userId: user.id,
    selectionMethod: 'RANDOM',
    selectedAt: new Date(),
    status: 'PENDING_CLAIM',
    claimDeadline: claimDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  const claim = await PrizeClaim.create({
    winnerId: winner.id,
    userId: user.id,
    prizeId: prize.id,
    claimType: prize.claimType === 'EMAIL' ? 'EMAIL' : 'PHYSICAL',
    status: 'NOT_SUBMITTED',
  });
  return { winner, claim };
}

const validPhysicalPayload = {
  fullName: 'Jane Doe',
  phone: '9876543210',
  address: '123 Main Street',
  city: 'Bengaluru',
  state: 'Karnataka',
  pin: '560001',
};

describe('GET /api/giveaways/:prizeId/my-claim', () => {
  it('rejects an unauthenticated request', async () => {
    const { prize } = await createGiveawayAndPrize();
    const res = await request(app).get(`/api/giveaways/${prize.id}/my-claim`);
    expect(res.status).toBe(401);
  });

  it('reports isWinner:false for a non-winner', async () => {
    const { prize } = await createGiveawayAndPrize();
    const { token } = await createUser();

    const res = await request(app).get(`/api/giveaways/${prize.id}/my-claim`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.isWinner).toBe(false);
    expect(res.body.data.claim).toBeNull();
  });

  it('reports the claim status for an actual winner', async () => {
    const { giveaway, prize } = await createGiveawayAndPrize();
    const { user, token } = await createUser();
    await makeWinner(user, prize, giveaway);

    const res = await request(app).get(`/api/giveaways/${prize.id}/my-claim`).set('Authorization', `Bearer ${token}`);
    expect(res.body.data.isWinner).toBe(true);
    expect(res.body.data.claim.status).toBe('NOT_SUBMITTED');
    expect(res.body.data.claim.claimType).toBe('PHYSICAL');
  });

  it('distinguishes "winners not yet selected" from "selected but you lost"', async () => {
    const { giveaway, prize } = await createGiveawayAndPrize();
    const { token: loserToken } = await createUser();

    // Before ANY winner exists for this prize — selection simply hasn't run yet
    const beforeSelection = await request(app)
      .get(`/api/giveaways/${prize.id}/my-claim`)
      .set('Authorization', `Bearer ${loserToken}`);
    expect(beforeSelection.body.data.isWinner).toBe(false);
    expect(beforeSelection.body.data.winnersFinalized).toBe(false);

    // Someone else wins — selection has now run for this prize
    const { user: winningUser } = await createUser();
    await makeWinner(winningUser, prize, giveaway);

    const afterSelection = await request(app)
      .get(`/api/giveaways/${prize.id}/my-claim`)
      .set('Authorization', `Bearer ${loserToken}`);
    expect(afterSelection.body.data.isWinner).toBe(false);
    expect(afterSelection.body.data.winnersFinalized).toBe(true);
  });
});

describe('POST /api/giveaways/:prizeId/claim — ownership', () => {
  it('rejects a non-winner from submitting a claim', async () => {
    const { prize } = await createGiveawayAndPrize();
    const { token } = await createUser();

    const res = await request(app)
      .post(`/api/giveaways/${prize.id}/claim`)
      .set('Authorization', `Bearer ${token}`)
      .send(validPhysicalPayload);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CLAIM_NOT_ALLOWED');
  });

  it("rejects one winner submitting for a DIFFERENT prize they didn't win", async () => {
    const { giveaway, prize: prizeA } = await createGiveawayAndPrize();
    const prizeB = await Prize.create({
      giveawayId: giveaway.id,
      slug: `prize-b-${Date.now()}`,
      name: 'Other Prize',
      type: 'PHYSICAL',
      claimType: 'PHYSICAL_ADDRESS',
      entryCurrency: 'VE',
      entryAmount: 50,
      winnerCount: 1,
    });

    const { user: winnerOfA, token: tokenA } = await createUser();
    await makeWinner(winnerOfA, prizeA, giveaway);

    // winnerOfA is a winner of prizeA, NOT prizeB — must be rejected for prizeB
    const res = await request(app)
      .post(`/api/giveaways/${prizeB.id}/claim`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validPhysicalPayload);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CLAIM_NOT_ALLOWED');
  });
});

describe('POST /api/giveaways/:prizeId/claim — physical prize', () => {
  it('submits successfully with all required fields', async () => {
    const { giveaway, prize } = await createGiveawayAndPrize();
    const { user, token } = await createUser();
    await makeWinner(user, prize, giveaway);

    const res = await request(app)
      .post(`/api/giveaways/${prize.id}/claim`)
      .set('Authorization', `Bearer ${token}`)
      .send(validPhysicalPayload);

    expect(res.status).toBe(200);
    expect(res.body.data.claim.status).toBe('SUBMITTED');
    expect(res.body.data.claim.city).toBe('Bengaluru');
  });

  it('rejects a submission missing a required physical field', async () => {
    const { giveaway, prize } = await createGiveawayAndPrize();
    const { user, token } = await createUser();
    await makeWinner(user, prize, giveaway);

    const { phone, ...incomplete } = validPhysicalPayload;
    void phone;

    const res = await request(app)
      .post(`/api/giveaways/${prize.id}/claim`)
      .set('Authorization', `Bearer ${token}`)
      .send(incomplete);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a second submission for the same claim', async () => {
    const { giveaway, prize } = await createGiveawayAndPrize();
    const { user, token } = await createUser();
    await makeWinner(user, prize, giveaway);

    await request(app).post(`/api/giveaways/${prize.id}/claim`).set('Authorization', `Bearer ${token}`).send(validPhysicalPayload);
    const second = await request(app)
      .post(`/api/giveaways/${prize.id}/claim`)
      .set('Authorization', `Bearer ${token}`)
      .send(validPhysicalPayload);

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('CLAIM_ALREADY_SUBMITTED');
  });

  it('rejects a submission past the claim deadline', async () => {
    const { giveaway, prize } = await createGiveawayAndPrize();
    const { user, token } = await createUser();
    await makeWinner(user, prize, giveaway, { claimDeadline: new Date(Date.now() - 60 * 1000) }); // expired 1 min ago

    const res = await request(app)
      .post(`/api/giveaways/${prize.id}/claim`)
      .set('Authorization', `Bearer ${token}`)
      .send(validPhysicalPayload);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CLAIM_EXPIRED');
  });
});

describe('POST /api/giveaways/:prizeId/claim — gift card prize', () => {
  it('submits successfully with only an email, no physical address required', async () => {
    const { giveaway, prize } = await createGiveawayAndPrize({ claimType: 'EMAIL' });
    const { user, token } = await createUser();
    await makeWinner(user, prize, giveaway);

    const res = await request(app)
      .post(`/api/giveaways/${prize.id}/claim`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'winner@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.data.claim.status).toBe('SUBMITTED');
    expect(res.body.data.claim.email).toBe('winner@example.com');
  });

  it('rejects a gift-card claim with no email', async () => {
    const { giveaway, prize } = await createGiveawayAndPrize({ claimType: 'EMAIL' });
    const { user, token } = await createUser();
    await makeWinner(user, prize, giveaway);

    const res = await request(app)
      .post(`/api/giveaways/${prize.id}/claim`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
