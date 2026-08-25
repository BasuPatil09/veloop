const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class AuditLog extends Model {}

AuditLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    action: {
      type: DataTypes.ENUM(
        'JOIN_GIVEAWAY',
        'ENTRY_FEE_DEDUCTED',
        'JOIN_REJECTED',
        'DUPLICATE_ATTEMPT',
        'FRAUD_FLAGGED',
        'CLAIM_SUBMITTED',
        'WINNER_SELECTED',
      ),
      allowNull: false,
    },
    giveawayId: { type: DataTypes.UUID, allowNull: true },
    amount: { type: DataTypes.INTEGER, allowNull: true },
    currency: { type: DataTypes.STRING, allowNull: true },
    result: { type: DataTypes.STRING, allowNull: true },
    requestId: { type: DataTypes.STRING, allowNull: true },
    meta: { type: DataTypes.JSON, allowNull: true },
  },
  { sequelize, modelName: 'AuditLog', tableName: 'audit_logs', timestamps: true },
);

module.exports = AuditLog;
