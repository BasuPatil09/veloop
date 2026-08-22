const { body } = require('express-validator');

const SLUG_PATTERN = /^[a-z0-9-]+$/;

const createGiveawayValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('slug')
    .trim()
    .notEmpty()
    .withMessage('Slug is required')
    .matches(SLUG_PATTERN)
    .withMessage('Slug must be lowercase letters, numbers, and hyphens only'),
  body('description').optional({ nullable: true }).isString(),
  body('startAt').isISO8601().withMessage('startAt must be a valid date'),
  body('endAt')
    .isISO8601()
    .withMessage('endAt must be a valid date')
    .custom((endAt, { req }) => new Date(endAt) > new Date(req.body.startAt))
    .withMessage('endAt must be after startAt'),
  body('bannerImage').optional({ nullable: true }).isString(),
  body('allowMultipleEntries').optional().isBoolean(),

  body('prizes').isArray({ min: 1 }).withMessage('At least one prize is required'),
  body('prizes.*.name').trim().notEmpty().withMessage('Each prize needs a name'),
  body('prizes.*.slug')
    .trim()
    .notEmpty()
    .withMessage('Each prize needs a slug')
    .matches(SLUG_PATTERN)
    .withMessage('Prize slug must be lowercase letters, numbers, and hyphens only'),
  body('prizes.*.type').isIn(['PHYSICAL', 'GIFT_CARD', 'DIGITAL']).withMessage('Invalid prize type'),
  body('prizes.*.claimType').isIn(['PHYSICAL_ADDRESS', 'EMAIL']).withMessage('Invalid claim type'),
  body('prizes.*.entryCurrency').isIn(['VE', 'SVE', 'TOKEN']).withMessage('Invalid entry currency'),
  body('prizes.*.entryAmount').isInt({ min: 0 }).withMessage('entryAmount must be a non-negative integer'),
  body('prizes.*.winnerCount').optional().isInt({ min: 1 }).withMessage('winnerCount must be at least 1'),
];

module.exports = { createGiveawayValidator };
