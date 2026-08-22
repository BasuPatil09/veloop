const express = require('express');
const giveawayController = require('../controllers/giveawayController');

const router = express.Router();

// Specific paths must be registered before the '/:id' catch-all, or Express would
// try to resolve "current"/"previous"/"stats" as a giveaway id.
router.get('/current', giveawayController.getCurrent);
router.get('/previous', giveawayController.getPrevious);
router.get('/stats', giveawayController.getStats);
router.get('/slug/:slug', giveawayController.getBySlug);
router.get('/:id', giveawayController.getById);

module.exports = router;
