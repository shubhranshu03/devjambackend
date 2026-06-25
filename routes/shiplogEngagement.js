const express = require('express');
const router = express.Router();

const {
  getLikeCount,
  likeShipLog,
  unlikeShipLog,
  getComments,
  addComment,
  deleteComment,
  checkIfLiked,
} = require('../controllers/shiplogEngagementController');

// GET likes count
router.get('/:shiplogId/likes', getLikeCount);

// GET check if current user liked
router.get('/:shiplogId/liked', checkIfLiked);

// POST like
router.post('/:shiplogId/like', likeShipLog);

// DELETE unlike
router.delete('/:shiplogId/like', unlikeShipLog);

// GET comments
router.get('/:shiplogId/comments', getComments);

// POST comment
router.post('/:shiplogId/comments', addComment);

// DELETE comment
router.delete('/comments/:commentId', deleteComment);

module.exports = router;
