const express = require('express');
const { param } = require('express-validator');
const giveawayController = require('../controllers/giveawayController');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

// Specific paths must be registered before the '/:id' catch-all, or Express would
// try to resolve "current"/"previous"/"stats" as a giveaway id.
router.get('/current', giveawayController.getCurrent);
router.get('/previous', giveawayController.getPrevious);
router.get('/stats', giveawayController.getStats);
router.get('/slug/:slug', giveawayController.getBySlug);
router.get('/:id', validate([param('id').isUUID().withMessage('Invalid giveaway.')]), giveawayController.getById);

module.exports = router;
