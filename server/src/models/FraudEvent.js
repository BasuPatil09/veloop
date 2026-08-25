const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class FraudEvent extends Model {}

FraudEvent.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    giveawayId: { type: DataTypes.UUID, allowNull: true },
    deviceHash: { type: DataTypes.STRING, allowNull: true },
    ipHash: { type: DataTypes.STRING, allowNull: true },
    riskScore: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING, allowNull: true },
    signals: { type: DataTypes.JSON, allowNull: true },
    action: { type: DataTypes.ENUM('ALLOWED', 'FLAGGED', 'BLOCKED'), allowNull: false },
  },
  { sequelize, modelName: 'FraudEvent', tableName: 'fraud_events', timestamps: true },
);

module.exports = FraudEvent;
