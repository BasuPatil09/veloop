const express = require('express');
const claimController = require('../controllers/claimController');
const { requireAuth } = require('../middleware/authMiddleware');
const { sensitiveActionLimiter } = require('../middleware/rateLimitMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { claimValidator, myClaimValidator } = require('../validators/claimValidators');

const router = express.Router();

// :prizeId — same per-prize scoping as participationRoutes (see architecture doc,
// "Entry scope"). Both routes require auth; ownership itself is re-checked inside
// claimService against req.user.id, never trusted from the URL or body.
router.get('/:prizeId/my-claim', requireAuth, validate(myClaimValidator), claimController.getMyClaim);
router.post(
  '/:prizeId/claim',
  requireAuth,
  sensitiveActionLimiter,
  validate(claimValidator),
  claimController.submitClaim,
);

module.exports = router;
