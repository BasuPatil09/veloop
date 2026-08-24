const { param, body } = require('express-validator');

// Which fields are actually REQUIRED depends on the prize's claimType, which is looked
// up server-side in claimService (never trusted from the client) — these validators
// only check the shape/format of whatever was sent, not which fields must be present.
const claimValidator = [
  param('prizeId').isUUID().withMessage('Invalid giveaway.'),
  body('email').optional({ nullable: true }).isEmail().withMessage('Enter a valid email address.'),
  body('fullName').optional({ nullable: true }).isString().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional({ nullable: true }).isString().trim().isLength({ min: 7, max: 20 }),
  body('address').optional({ nullable: true }).isString().trim().isLength({ min: 5, max: 300 }),
  body('city').optional({ nullable: true }).isString().trim().isLength({ min: 2, max: 100 }),
  body('state').optional({ nullable: true }).isString().trim().isLength({ min: 2, max: 100 }),
  body('pin').optional({ nullable: true }).isString().trim().isLength({ min: 3, max: 12 }),
];

const myClaimValidator = [param('prizeId').isUUID().withMessage('Invalid giveaway.')];

module.exports = { claimValidator, myClaimValidator };
