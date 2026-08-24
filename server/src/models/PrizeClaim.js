const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class PrizeClaim extends Model {}

PrizeClaim.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    winnerId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // one claim record per winner
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    prizeId: { type: DataTypes.UUID, allowNull: false },
    claimType: {
      type: DataTypes.ENUM('PHYSICAL', 'EMAIL'),
      allowNull: false,
    },
    // Physical-prize fields
    fullName: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING(500), allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    pin: { type: DataTypes.STRING, allowNull: true },
    // Gift-card field
    email: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM('NOT_SUBMITTED', 'SUBMITTED', 'PROCESSING', 'COMPLETED', 'EXPIRED'),
      allowNull: false,
      defaultValue: 'NOT_SUBMITTED',
    },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    processedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'PrizeClaim',
    tableName: 'prize_claims',
    timestamps: true,
  },
);

module.exports = PrizeClaim;
