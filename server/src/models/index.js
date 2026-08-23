const { sequelize } = require('../config/db');
const User = require('./User');
const Giveaway = require('./Giveaway');
const Prize = require('./Prize');
const GiveawayParticipation = require('./GiveawayParticipation');
const GiveawayEntryTransaction = require('./GiveawayEntryTransaction');

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

module.exports = { sequelize, User, Giveaway, Prize, GiveawayParticipation, GiveawayEntryTransaction };
