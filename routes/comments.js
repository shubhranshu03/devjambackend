/**
 * routes/comments.js
 * Standalone comment delete route (add is nested under /projects/:id/comments).
 */

const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const { deleteComment } = require('../controllers/commentsController');

// DELETE /api/comments/:commentId
router.delete('/:commentId', requireAuth, deleteComment);

module.exports = router;
