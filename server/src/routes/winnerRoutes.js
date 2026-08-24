const express = require('express');
const { param } = require('express-validator');
const winnerController = require('../controllers/winnerController');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

// Two-segment paths — no collision with giveawayRoutes' single-segment '/:id' or
// '/previous' (mounted at the same /api/giveaways prefix).
router.get('/previous/winners', winnerController.getPreviousWinners);
router.get('/:id/winners', validate([param('id').isUUID().withMessage('Invalid giveaway.')]), winnerController.getWinnersForGiveaway);

module.exports = router;
