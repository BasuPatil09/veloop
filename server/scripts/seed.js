/* eslint-disable no-console */
const bcrypt = require('bcryptjs');
const { sequelize, User, Giveaway, Prize } = require('../src/models');
const { env } = require('../src/config/env');
const giveawayService = require('../src/services/giveawayService');

const ADMIN_EMAIL = 'admin@veloop.local';
const ADMIN_PASSWORD = 'AdminPass123';

async function ensureAdmin() {
  let admin = await User.findOne({ where: { email: ADMIN_EMAIL } });
  if (admin) return admin;

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, env.bcryptSaltRounds);
  admin = await User.create({ name: 'VELOOP Admin', email: ADMIN_EMAIL, passwordHash, role: 'admin' });
  console.log(`Created admin user: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  return admin;
}

async function createGiveaway(adminId, { title, slug, description, startAt, endAt }, prizes) {
  const existing = await Giveaway.findOne({ where: { slug } });
  if (existing) {
    console.log(`Giveaway "${slug}" already exists — skipping.`);
    return;
  }

  const giveaway = await Giveaway.create({
    title,
    slug,
    description,
    startAt,
    endAt,
    createdById: adminId,
    status: giveawayService.computeEffectiveStatus({ startAt, endAt, status: 'upcoming' }),
  });

  await Prize.bulkCreate(prizes.map((prize, index) => ({ ...prize, giveawayId: giveaway.id, sortOrder: index })));
  console.log(`Created giveaway "${title}" (${giveaway.status}) with ${prizes.length} prize(s).`);
}

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const admin = await ensureAdmin();
  const now = Date.now();
  const days = (n) => new Date(now + n * 24 * 60 * 60 * 1000);

  await createGiveaway(
    admin.id,
    {
      title: 'Summer Rewards Giveaway',
      slug: 'summer-rewards-giveaway',
      description: 'Complete eligible activities, collect entries, and get a chance to win exciting rewards.',
      startAt: days(-2),
      endAt: days(12),
    },
    [
      {
        slug: 'iphone-15-pro',
        name: 'iPhone 15 Pro',
        position: '1st Prize',
        description: 'The latest iPhone 15 Pro.',
        type: 'PHYSICAL',
        claimType: 'PHYSICAL_ADDRESS',
        entryCurrency: 'VE',
        entryAmount: 250,
        winnerCount: 1,
      },
      {
        slug: 'apple-watch',
        name: 'Apple Watch Series 9',
        position: '2nd Prize',
        description: 'Apple Watch Series 9.',
        type: 'PHYSICAL',
        claimType: 'PHYSICAL_ADDRESS',
        entryCurrency: 'VE',
        entryAmount: 200,
        winnerCount: 3,
      },
      {
        slug: 'airpods',
        name: 'AirPods Pro',
        position: '3rd Prize',
        description: 'AirPods Pro (2nd generation).',
        type: 'PHYSICAL',
        claimType: 'PHYSICAL_ADDRESS',
        entryCurrency: 'SVE',
        entryAmount: 500,
        winnerCount: 5,
      },
      {
        slug: 'amazon-2000',
        name: '₹2,000 Amazon Gift Card',
        position: 'Lucky Draw',
        description: 'A ₹2,000 Amazon gift card, delivered by email.',
        type: 'GIFT_CARD',
        claimType: 'EMAIL',
        entryCurrency: 'VE',
        entryAmount: 500,
        winnerCount: 10,
        value: '₹2,000',
      },
      {
        slug: 'amazon-500',
        name: '₹500 Amazon Gift Card',
        position: 'Lucky Draw',
        description: 'A ₹500 Amazon gift card, delivered by email.',
        type: 'GIFT_CARD',
        claimType: 'EMAIL',
        entryCurrency: 'VE',
        entryAmount: 300,
        winnerCount: 10,
        value: '₹500',
      },
      {
        slug: 'amazon-20',
        name: '₹20 Amazon Voucher',
        position: 'Lucky Draw',
        description: 'A ₹20 Amazon voucher, delivered by email.',
        type: 'GIFT_CARD',
        claimType: 'EMAIL',
        entryCurrency: 'TOKEN',
        entryAmount: 2000,
        winnerCount: 50,
        value: '₹20',
      },
    ],
  );

  await createGiveaway(
    admin.id,
    {
      title: 'September Rewards',
      slug: 'september-rewards',
      description: 'A brand-new set of rewards, starting soon.',
      startAt: days(12),
      endAt: days(26),
    },
    [
      {
        slug: 'iphone-16',
        name: 'iPhone 16',
        position: '1st Prize',
        description: 'The latest iPhone 16.',
        type: 'PHYSICAL',
        claimType: 'PHYSICAL_ADDRESS',
        entryCurrency: 'VE',
        entryAmount: 300,
        winnerCount: 1,
      },
    ],
  );

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
