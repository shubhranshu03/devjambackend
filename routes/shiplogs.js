const express = require('express');
const router = express.Router();

const {
  getAllShipLogs,
  getShipLogs,
  getMyShipLogs,
  createShipLog,
  deleteShipLog,
} = require('../controllers/shipLogsController');

// Community feed - Get all ship logs (public)
router.get('/', getAllShipLogs);

// Auth-required routes MUST come next
router.get('/me', getMyShipLogs);
router.post('/', createShipLog);
router.delete('/:id', deleteShipLog);

// Public route - get shiplogs for any user (MUST come last)
router.get('/:userEmail', getShipLogs);

module.exports = router;
