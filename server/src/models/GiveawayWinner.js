const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class GiveawayWinner extends Model {}

GiveawayWinner.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    giveawayId: { type: DataTypes.UUID, allowNull: false },
    prizeId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    selectionMethod: {
      type: DataTypes.ENUM('MANUAL', 'RANDOM'),
      allowNull: false,
      defaultValue: 'RANDOM',
    },
    selectedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('PENDING_CLAIM', 'CLAIMED', 'EXPIRED'),
      allowNull: false,
      defaultValue: 'PENDING_CLAIM',
    },
    claimDeadline: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'GiveawayWinner',
    tableName: 'giveaway_winners',
    timestamps: true,
    indexes: [
      // Prevents a duplicate winner record for the same prize — the winner-selection
      // service is also idempotent (checks existing count before selecting more), but
      // this is the DB-level guarantee that survives it being run concurrently.
      { unique: true, fields: ['prizeId', 'userId'] },
    ],
  },
);

module.exports = GiveawayWinner;
