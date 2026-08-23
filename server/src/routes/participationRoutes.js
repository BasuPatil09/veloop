const express = require('express');
const participationController = require('../controllers/participationController');
const { requireAuth } = require('../middleware/authMiddleware');
const { sensitiveActionLimiter } = require('../middleware/rateLimitMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { joinValidator, myStatusValidator } = require('../validators/participationValidators');

const router = express.Router();

// :prizeId identifies a Prize — the individually-joinable entity (see architecture
// doc, "Entry scope"). Mounted at the same /api/giveaways prefix as giveawayRoutes
// for route-map continuity with the assignment spec; no path collision since these
// are always two path segments ("/:prizeId/my-status") vs. giveawayRoutes' single
// segment ("/:id").
router.get('/:prizeId/my-status', requireAuth, validate(myStatusValidator), participationController.getMyStatus);
router.post(
  '/:prizeId/join',
  requireAuth,
  sensitiveActionLimiter,
  validate(joinValidator),
  participationController.join,
);

module.exports = router;
