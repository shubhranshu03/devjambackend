/**
 * routes/badges.js
 * Badge system routes.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getAllBadges,
  getUserBadges,
  checkAndAwardBadges,
  updateStreak,
} = require('../controllers/badgesController');

// Public routes
router.get('/', getAllBadges); // GET /api/badges

// Protected routes
router.get('/me', requireAuth, getUserBadges); // GET /api/badges/me
router.post('/check', requireAuth, checkAndAwardBadges); // POST /api/badges/check
router.post('/streak', requireAuth, updateStreak); // POST /api/badges/streak

module.exports = router;
