const express = require('express');
const participationController = require('../controllers/participationController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Deliberately a separate top-level base path (/api/users), not nested under
// /api/giveaways — giveawayRoutes' catch-all '/:id' (single path segment) would
// otherwise try to resolve a request here as a giveaway id lookup before ever
// reaching this route.
router.get('/me/participations', requireAuth, participationController.getMyParticipations);

module.exports = router;
