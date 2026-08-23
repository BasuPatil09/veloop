const { param, body } = require('express-validator');

const joinValidator = [
  param('prizeId').isUUID().withMessage('Invalid giveaway.'),
  body('idempotencyKey')
    .optional({ nullable: true })
    .isString()
    .isLength({ min: 8, max: 100 })
    .withMessage('Invalid request.'),
];

const myStatusValidator = [param('prizeId').isUUID().withMessage('Invalid giveaway.')];

module.exports = { joinValidator, myStatusValidator };
