const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Prize extends Model {}

Prize.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    giveawayId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // What /giveaway/:slug actually resolves against — see architecture doc,
    // "Entry scope" assumption. Each prize is independently joinable with its
    // own entry fee/currency, even though several prizes share one campaign.
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: { msg: 'A prize with this slug already exists.' },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'Prize name is required' } },
    },
    position: {
      type: DataTypes.STRING, // e.g. "1st Prize", "Lucky Draw"
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('PHYSICAL', 'GIFT_CARD', 'DIGITAL'),
      allowNull: false,
    },
    claimType: {
      type: DataTypes.ENUM('PHYSICAL_ADDRESS', 'EMAIL'),
      allowNull: false,
    },
    entryCurrency: {
      type: DataTypes.ENUM('VE', 'SVE', 'TOKEN'),
      allowNull: false,
    },
    entryAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    winnerCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1 },
    },
    value: {
      type: DataTypes.STRING, // optional display-only, e.g. "₹2,000"
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Prize',
    tableName: 'prizes',
    timestamps: true,
  },
);

module.exports = Prize;
