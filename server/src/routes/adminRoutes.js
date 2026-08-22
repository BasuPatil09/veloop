const express = require('express');
const adminGiveawayController = require('../controllers/adminGiveawayController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/requireRole');
const { validate } = require('../middleware/validationMiddleware');
const { createGiveawayValidator } = require('../validators/giveawayValidators');

const router = express.Router();

// Every route below requires authentication AND the admin role — never expose an
// unsecured admin action (architecture doc, section G / spec §13, §49).
router.use(requireAuth, requireRole('admin'));

router.post('/giveaways', validate(createGiveawayValidator), adminGiveawayController.createGiveaway);

module.exports = router;
