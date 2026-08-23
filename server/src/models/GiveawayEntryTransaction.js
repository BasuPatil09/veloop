const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class GiveawayEntryTransaction extends Model {}

GiveawayEntryTransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    giveawayId: { type: DataTypes.UUID, allowNull: false },
    prizeId: { type: DataTypes.UUID, allowNull: false },
    currency: {
      type: DataTypes.ENUM('VE', 'SVE', 'TOKEN'),
      allowNull: false,
    },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM('ENTRY_FEE', 'REVERSAL'),
      allowNull: false,
      defaultValue: 'ENTRY_FEE',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED', 'REVERSED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    balanceBefore: { type: DataTypes.INTEGER, allowNull: true },
    balanceAfter: { type: DataTypes.INTEGER, allowNull: true },
    // Client-generated, reused across retries of the SAME join attempt (not
    // regenerated per click) — lets a network-level retry return the original
    // result instead of double-charging (architecture doc, section J).
    idempotencyKey: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: 'GiveawayEntryTransaction',
    tableName: 'giveaway_entry_transactions',
    timestamps: true,
  },
);

module.exports = GiveawayEntryTransaction;
