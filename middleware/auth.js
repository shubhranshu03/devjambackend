/**
 * middleware/auth.js
 * Verifies that a valid NextAuth session token exists.
 * The frontend passes email via X-User-Email header (from session).
 */

const requireAuth = (req, res, next) => {
  const userEmail = req.headers['x-user-email'];
  const userName  = req.headers['x-user-name'];

  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized: no session email provided.' });
  }

  // Attach user info to req so routes can use it
  req.user = {
    email: userEmail,
    name: userName || 'Anonymous',
  };

  next();
};

module.exports = { requireAuth };
