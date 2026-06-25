/**
 * routes/users.js
 * User profile and leaderboard routes.
 */

const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getMe, getProfileByEmail, updateMe, getMyStats, getLeaderboard } = require('../controllers/usersController');

// Public
router.get('/leaderboard', getLeaderboard); // GET /api/users/leaderboard
router.get('/profile/:email', getProfileByEmail); // GET /api/users/profile/:email

// Protected
router.get('/me',        requireAuth, getMe);       // GET   /api/users/me
router.patch('/me',      requireAuth, updateMe);    // PATCH /api/users/me
router.get('/me/stats',  requireAuth, getMyStats);  // GET   /api/users/me/stats

module.exports = router;
