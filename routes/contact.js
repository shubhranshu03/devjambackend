/**
 * routes/contact.js
 * Contact form submission routes
 */

const express = require('express');
const router = express.Router();

/**
 * POST /api/contact
 * Submit a contact form message
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, subject, message'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Message length validation
    if (message.length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters long' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message must not exceed 5000 characters' });
    }

    // TODO: Send email using your email service (e.g., SendGrid, Nodemailer, etc.)
    // For now, just log it
    console.log('📧 NEW CONTACT MESSAGE:');
    console.log(`  From: ${name} <${email}>`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Message: ${message}`);
    console.log(`  Timestamp: ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Message received! We will get back to you soon.',
      data: {
        name,
        email,
        subject,
        receivedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
