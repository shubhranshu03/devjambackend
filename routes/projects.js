/**
 * routes/projects.js
 * All project-related routes.
 */

const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getAllProjects,
  getProjectById,
  getUserProjects,
  createProject,
  updateProject,
  deleteProject,
  voteProject,
  getProjectsLeaderboard,
  getTrendingProjects,
  getHotProjects,
} = require('../controllers/projectsController');
const { getComments, addComment } = require('../controllers/commentsController');

// ── PUBLIC ROUTES (Static paths MUST come before /:id wildcard) ──
router.get('/',           getAllProjects);   // GET  /api/projects
router.get('/leaderboard', getProjectsLeaderboard);  // GET /api/projects/leaderboard (by votes)
router.get('/trending',    getTrendingProjects);     // GET /api/projects/trending (by views)
router.get('/hot',         getHotProjects);          // GET /api/projects/hot (by combined score)
router.get('/user/me',     requireAuth, getUserProjects); // GET /api/projects/user/me (protected)

// ── PUBLIC WILDCARD ROUTES (After static paths) ──
router.get('/:id',        getProjectById);  // GET  /api/projects/:id
router.get('/:id/comments', getComments);   // GET  /api/projects/:id/comments

// ── PROTECTED ROUTES (Modifying routes) ──
router.post('/',               requireAuth, createProject);   // POST /api/projects
router.patch('/:id',           requireAuth, updateProject);   // PATCH /api/projects/:id
router.delete('/:id',          requireAuth, deleteProject);   // DELETE /api/projects/:id
router.post('/:id/vote',       requireAuth, voteProject);     // POST /api/projects/:id/vote
router.post('/:id/comments',   requireAuth, addComment);      // POST /api/projects/:id/comments

module.exports = router;
