process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_NAME = process.env.DB_NAME || 'veloop_test';
process.env.DB_USER = process.env.DB_USER || 'veloop';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'veloop_dev_password';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || 'test-refresh-secret';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const { sequelize } = require('../src/config/db');
const { User, Giveaway, Prize, GiveawayParticipation } = require('../src/models');
const fraudService = require('../src/services/fraudService');

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await GiveawayParticipation.destroy({ where: {} });
  await Prize.destroy({ where: {} });
  await Giveaway.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

async function seedPrize() {
  const giveaway = await Giveaway.create({
    title: 'Fraud Test Giveaway',
    slug: `fraud-test-${Date.now()}`,
    status: 'active',
    startAt: new Date(Date.now() - 60 * 1000),
    endAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  const prize = await Prize.create({
    giveawayId: giveaway.id,
    slug: `fraud-prize-${Date.now()}`,
    name: 'Fraud Test Prize',
    type: 'PHYSICAL',
    claimType: 'PHYSICAL_ADDRESS',
    entryCurrency: 'VE',
    entryAmount: 10,
    winnerCount: 1,
  });
  return { giveaway, prize };
}

async function makeParticipation({ userId, prize, giveaway, deviceHash }) {
  return GiveawayParticipation.create({
    userId,
    giveawayId: giveaway.id,
    prizeId: prize.id,
    entryCurrency: 'VE',
    entryAmount: 10,
    status: 'SUCCESS',
    deviceHash,
    joinedAt: new Date(),
  });
}

describe('fraudService.scoreJoinAttempt', () => {
  it('scores a clean, first-time attempt as ALLOWED with no signals', async () => {
    const user = await User.create({ name: 'Solo', email: 'solo@example.com', passwordHash: 'x' });
    const result = await fraudService.scoreJoinAttempt({ userId: user.id, deviceHash: 'unique-device-hash-1' });

    expect(result.action).toBe('ALLOWED');
    expect(result.score).toBe(0);
    expect(result.signals).toEqual([]);
  });

  it('flags (but does not block) moderate device sharing — a couple of accounts on one device', async () => {
    const { giveaway, prize } = await seedPrize();
    const sharedDevice = 'shared-device-hash-moderate';

    const otherUser1 = await User.create({ name: 'Other1', email: 'other1@example.com', passwordHash: 'x' });
    const otherUser2 = await User.create({ name: 'Other2', email: 'other2@example.com', passwordHash: 'x' });
    await makeParticipation({ userId: otherUser1.id, prize, giveaway, deviceHash: sharedDevice });
    await makeParticipation({ userId: otherUser2.id, prize, giveaway, deviceHash: sharedDevice });

    const user = await User.create({ name: 'Newcomer', email: 'newcomer@example.com', passwordHash: 'x' });
    const result = await fraudService.scoreJoinAttempt({ userId: user.id, deviceHash: sharedDevice });

    // 2 other accounts * 15 weight = 30 -> below the 60 MEDIUM threshold, so still ALLOWED
    expect(result.score).toBe(30);
    expect(result.action).toBe('ALLOWED');
    expect(result.signals[0]).toMatch(/device_shared_with_2_other_account/);
  });

  it('flags heavy device sharing as FLAGGED, not yet BLOCKED', async () => {
    const { giveaway, prize } = await seedPrize();
    const sharedDevice = 'shared-device-hash-heavy';

    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const other = await User.create({ name: `Farmer${i}`, email: `farmer${i}@example.com`, passwordHash: 'x' });
      // eslint-disable-next-line no-await-in-loop
      await makeParticipation({ userId: other.id, prize, giveaway, deviceHash: sharedDevice });
    }

    const user = await User.create({ name: 'Sixth', email: 'sixth@example.com', passwordHash: 'x' });
    const result = await fraudService.scoreJoinAttempt({ userId: user.id, deviceHash: sharedDevice });

    // 5 other accounts * 15 = 75, capped at 60 -> FLAGGED (>= 60, < 80)
    expect(result.score).toBe(60);
    expect(result.action).toBe('FLAGGED');
  });

  it('does NOT count the same user\u2019s own past attempts as "other accounts" on the device', async () => {
    const { giveaway, prize } = await seedPrize();
    const user = await User.create({ name: 'RepeatJoiner', email: 'repeat@example.com', passwordHash: 'x' });
    const device = 'own-device-hash';

    // Same user, different prize — their own history shouldn't inflate their device-sharing signal
    await makeParticipation({ userId: user.id, prize, giveaway, deviceHash: device });

    const result = await fraudService.scoreJoinAttempt({ userId: user.id, deviceHash: device });
    expect(result.signals).toEqual([]);
    expect(result.score).toBe(0);
  });

  it('flags high request velocity from the same user', async () => {
    const { giveaway } = await seedPrize();
    const user = await User.create({ name: 'Speedy', email: 'speedy@example.com', passwordHash: 'x' });

    // 3 recent participations (different prizes) in the last minute
    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const p = await Prize.create({
        giveawayId: giveaway.id,
        slug: `speedy-prize-${i}`,
        name: `Speedy Prize ${i}`,
        type: 'PHYSICAL',
        claimType: 'PHYSICAL_ADDRESS',
        entryCurrency: 'VE',
        entryAmount: 10,
        winnerCount: 1,
      });
      // eslint-disable-next-line no-await-in-loop
      await makeParticipation({ userId: user.id, prize: p, giveaway, deviceHash: `device-${i}` });
    }

    const result = await fraudService.scoreJoinAttempt({ userId: user.id, deviceHash: 'a-new-device' });
    expect(result.signals).toContain('high_request_velocity');
    expect(result.score).toBeGreaterThanOrEqual(25);
  });

  it('combines signals into a BLOCKED score when both device sharing and velocity are extreme', async () => {
    const { giveaway, prize } = await seedPrize();
    const sharedDevice = 'shared-device-extreme';

    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const other = await User.create({ name: `Extreme${i}`, email: `extreme${i}@example.com`, passwordHash: 'x' });
      // eslint-disable-next-line no-await-in-loop
      await makeParticipation({ userId: other.id, prize, giveaway, deviceHash: sharedDevice });
    }

    const user = await User.create({ name: 'Blocked', email: 'blocked@example.com', passwordHash: 'x' });
    // Give this user 3 recent attempts too, to also trip the velocity signal
    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const p = await Prize.create({
        giveawayId: giveaway.id,
        slug: `blocked-prize-${i}`,
        name: `Blocked Prize ${i}`,
        type: 'PHYSICAL',
        claimType: 'PHYSICAL_ADDRESS',
        entryCurrency: 'VE',
        entryAmount: 10,
        winnerCount: 1,
      });
      // eslint-disable-next-line no-await-in-loop
      await makeParticipation({ userId: user.id, prize: p, giveaway, deviceHash: `own-device-${i}` });
    }

    const result = await fraudService.scoreJoinAttempt({ userId: user.id, deviceHash: sharedDevice });
    // 60 (capped device signal) + 25 (velocity) = 85 -> BLOCKED (>= 80)
    expect(result.score).toBe(85);
    expect(result.action).toBe('BLOCKED');
    expect(result.signals).toHaveLength(2);
  });
});
