const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: 'Name is required' } },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: { msg: 'An account with this email already exists.' },
      validate: { isEmail: { msg: 'Enter a valid email address' } },
      set(value) {
        // Mirrors the old Mongoose `lowercase: true` schema option.
        this.setDataValue('email', String(value).toLowerCase().trim());
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
    // Authoritative balances. The frontend only ever displays these; it never
    // computes or sends them as trusted values (architecture doc, section A/J).
    // Separate integer columns (rather than one JSON blob) so a future join-flow
    // transaction can lock and increment/decrement a single column directly.
    balanceVe: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    balanceSve: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    balanceToken: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    // SHA-256 hash of the current refresh token, so a stolen DB dump can't be
    // replayed as a valid refresh token and a single token can be revoked on logout.
    refreshTokenHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    defaultScope: {
      // Mirrors Mongoose's `select: false` — secrets are excluded unless explicitly
      // requested via User.scope('withSecrets'), the same opt-in pattern as before.
      attributes: { exclude: ['passwordHash', 'refreshTokenHash'] },
    },
    scopes: {
      withSecrets: {
        attributes: {},
      },
    },
  },
);

module.exports = User;
