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
} = require('../controllers/projectsController');
const { getComments, addComment } = require('../controllers/commentsController');

// Public routes
router.get('/',           getAllProjects);   // GET  /api/projects

// Protected routes (require login) — MUST come before /:id wildcard
router.get('/user/me',         requireAuth, getUserProjects); // GET  /api/projects/user/me

// Public wildcard routes (after static paths)
router.get('/:id',        getProjectById);  // GET  /api/projects/:id
router.get('/:id/comments', getComments);   // GET  /api/projects/:id/comments

// Other protected routes
router.post('/',               requireAuth, createProject);   // POST /api/projects
router.patch('/:id',           requireAuth, updateProject);   // PATCH /api/projects/:id
router.delete('/:id',          requireAuth, deleteProject);   // DELETE /api/projects/:id
router.post('/:id/vote',       requireAuth, voteProject);     // POST /api/projects/:id/vote
router.post('/:id/comments',   requireAuth, addComment);      // POST /api/projects/:id/comments

module.exports = router;
