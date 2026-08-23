const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class GiveawayParticipation extends Model {}

GiveawayParticipation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    giveawayId: { type: DataTypes.UUID, allowNull: false },
    prizeId: { type: DataTypes.UUID, allowNull: false },
    entryCurrency: {
      type: DataTypes.ENUM('VE', 'SVE', 'TOKEN'),
      allowNull: false,
    },
    entryAmount: { type: DataTypes.INTEGER, allowNull: false },
    // Lightweight abuse-prevention signals, not a hard identity lock — consumed by
    // the fraud service in Phase 5, not enforced yet (architecture doc, section J/24).
    deviceHash: { type: DataTypes.STRING, allowNull: true },
    ipHash: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED', 'BLOCKED'),
      allowNull: false,
      defaultValue: 'SUCCESS',
    },
    transactionId: { type: DataTypes.UUID, allowNull: true },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'GiveawayParticipation',
    tableName: 'giveaway_participations',
    timestamps: true,
    indexes: [
      // One entry per user per PRIZE — see "Entry scope" in the architecture doc.
      // Enforced at the DB, not just app logic, so it survives concurrent requests.
      { unique: true, fields: ['userId', 'prizeId'] },
    ],
  },
);

module.exports = GiveawayParticipation;
