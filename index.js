require('dotenv').config();
const express = require('express');
const cors    = require('cors');

// ── Routes ────────────────────────────────────────────────────
const projectRoutes = require('./routes/projects');
const userRoutes    = require('./routes/users');
const commentRoutes = require('./routes/comments');
const uploadRoutes  = require('./routes/upload');
const badgesRoutes  = require('./routes/badges');
const contactRoutes = require('./routes/contact');
const shipLogsRoutes = require('./routes/shiplogs');
const shiplogEngagementRoutes = require('./routes/shiplogEngagement');

// ── Middleware ────────────────────────────────────────────────
const { errorHandler } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────────
// Allow requests from Next.js dev server and production domain
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://devjamfrontend.vercel.app',
  process.env.FRONTEND_URL,        // set in .env for production
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    console.log(`[CORS] Request origin: ${origin || 'no-origin'}, Allowed: ${allowedOrigins.join(', ')}`);
    // Allow Postman / curl (no origin) in development
    if (!origin || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    console.warn(`[CORS] Blocked: ${origin}`);
    cb(null, true); // Allow anyway to prevent crashes
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-email', 'x-user-name', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('/api/*', cors(corsOptions));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logger (dev) ──────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health check ──────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    message: 'DevJam Backend API is running! 🚀',
    version: '1.0.0',
    endpoints: [
      'GET    /api/projects',
      'GET    /api/projects/:id',
      'POST   /api/projects          (auth)',
      'PATCH  /api/projects/:id      (auth)',
      'DELETE /api/projects/:id      (auth)',
      'POST   /api/projects/:id/vote (auth)',
      'GET    /api/projects/:id/comments',
      'POST   /api/projects/:id/comments (auth)',
      'DELETE /api/comments/:id      (auth)',
      'POST   /api/upload            (auth)',
      'GET    /api/users/me          (auth)',
      'PATCH  /api/users/me          (auth)',
      'GET    /api/users/me/stats    (auth)',
      'GET    /api/users/leaderboard',
    ],
  });
});

// ── Mount routers ──────────────────────────────────────────────
app.use('/api/projects', projectRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/upload',   uploadRoutes);
app.use('/api/badges',   badgesRoutes);
app.use('/api/contact',  contactRoutes);
app.use('/api/shiplogs', shipLogsRoutes);
app.use('/api/shiplogs', shiplogEngagementRoutes);

// ── 404 handler ────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Global error handler ───────────────────────────────────────
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ DevJam API running → http://localhost:${PORT}`);
});
