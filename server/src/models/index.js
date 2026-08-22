const { sequelize } = require('../config/db');
const User = require('./User');
const Giveaway = require('./Giveaway');
const Prize = require('./Prize');

// Associations are declared centrally, once, to avoid circular requires between
// Giveaway.js and Prize.js. Anything that needs an association (`include: [...]`,
// eager loading, etc.) should require models from here rather than the individual
// model files directly.
Giveaway.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });
Giveaway.hasMany(Prize, { as: 'prizes', foreignKey: 'giveawayId', onDelete: 'CASCADE' });
Prize.belongsTo(Giveaway, { as: 'giveaway', foreignKey: 'giveawayId' });

module.exports = { sequelize, User, Giveaway, Prize };
