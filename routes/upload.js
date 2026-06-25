/**
 * routes/upload.js
 * Image upload routes.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { uploadImage } = require('../controllers/uploadController');

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB max
  fileFilter: (req, file, cb) => {
    const validMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (validMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Protected route
router.post('/', requireAuth, upload.single('file'), uploadImage);

module.exports = router;
