const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Giveaway extends Model {}

Giveaway.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Campaign-level identity — not the primary navigation target (see Prize.slug),
    // but useful for admin reference and for grouping prizes under one shared banner.
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'Title is required' } },
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: { msg: 'A giveaway with this slug already exists.' },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Authoritative lifecycle state. The frontend only ever displays this — it never
    // decides ACTIVE/ENDED itself from a countdown reaching zero (architecture doc, H).
    status: {
      type: DataTypes.ENUM('upcoming', 'active', 'ended', 'archived'),
      allowNull: false,
      defaultValue: 'upcoming',
    },
    startAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    bannerImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    allowMultipleEntries: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Giveaway',
    tableName: 'giveaways',
    timestamps: true,
    indexes: [{ fields: ['status', 'startAt', 'endAt'] }],
    validate: {
      endMustBeAfterStart() {
        if (this.startAt && this.endAt && new Date(this.endAt) <= new Date(this.startAt)) {
          throw new Error('endAt must be after startAt');
        }
      },
    },
  },
);

module.exports = Giveaway;
