const { sequelize } = require('../config/db');
const User = require('./User');
const Giveaway = require('./Giveaway');
const Prize = require('./Prize');
const GiveawayParticipation = require('./GiveawayParticipation');
const GiveawayEntryTransaction = require('./GiveawayEntryTransaction');
const GiveawayWinner = require('./GiveawayWinner');
const PrizeClaim = require('./PrizeClaim');
const FraudEvent = require('./FraudEvent');
const AuditLog = require('./AuditLog');

// Associations are declared centrally, once, to avoid circular requires between
// model files. Anything that needs an association (`include: [...]`, eager
// loading, etc.) should require models from here rather than individual files.

Giveaway.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });
Giveaway.hasMany(Prize, { as: 'prizes', foreignKey: 'giveawayId', onDelete: 'CASCADE' });
Prize.belongsTo(Giveaway, { as: 'giveaway', foreignKey: 'giveawayId' });

User.hasMany(GiveawayParticipation, { foreignKey: 'userId' });
GiveawayParticipation.belongsTo(User, { foreignKey: 'userId' });

Giveaway.hasMany(GiveawayParticipation, { foreignKey: 'giveawayId' });
GiveawayParticipation.belongsTo(Giveaway, { as: 'giveaway', foreignKey: 'giveawayId' });

Prize.hasMany(GiveawayParticipation, { foreignKey: 'prizeId' });
GiveawayParticipation.belongsTo(Prize, { as: 'prize', foreignKey: 'prizeId' });

GiveawayParticipation.belongsTo(GiveawayEntryTransaction, { as: 'transaction', foreignKey: 'transactionId' });

User.hasMany(GiveawayEntryTransaction, { foreignKey: 'userId' });
GiveawayEntryTransaction.belongsTo(User, { foreignKey: 'userId' });
GiveawayEntryTransaction.belongsTo(Giveaway, { foreignKey: 'giveawayId' });
GiveawayEntryTransaction.belongsTo(Prize, { foreignKey: 'prizeId' });

Giveaway.hasMany(GiveawayWinner, { as: 'winners', foreignKey: 'giveawayId' });
GiveawayWinner.belongsTo(Giveaway, { as: 'giveaway', foreignKey: 'giveawayId' });
Prize.hasMany(GiveawayWinner, { foreignKey: 'prizeId' });
GiveawayWinner.belongsTo(Prize, { as: 'prize', foreignKey: 'prizeId' });
User.hasMany(GiveawayWinner, { foreignKey: 'userId' });
GiveawayWinner.belongsTo(User, { foreignKey: 'userId' });

GiveawayWinner.hasOne(PrizeClaim, { as: 'claim', foreignKey: 'winnerId' });
PrizeClaim.belongsTo(GiveawayWinner, { as: 'winner', foreignKey: 'winnerId' });
PrizeClaim.belongsTo(User, { foreignKey: 'userId' });
PrizeClaim.belongsTo(Prize, { foreignKey: 'prizeId' });

User.hasMany(FraudEvent, { foreignKey: 'userId' });
FraudEvent.belongsTo(User, { foreignKey: 'userId' });
FraudEvent.belongsTo(Giveaway, { foreignKey: 'giveawayId' });

User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });
AuditLog.belongsTo(Giveaway, { foreignKey: 'giveawayId' });

module.exports = {
  sequelize,
  User,
  Giveaway,
  Prize,
  GiveawayParticipation,
  GiveawayEntryTransaction,
  GiveawayWinner,
  PrizeClaim,
  FraudEvent,
  AuditLog,
};
