/**
 * controllers/usersController.js
 * Handles user profile read/update, dashboard stats, and leaderboard.
 */

const { supabase } = require('../supabase');

// ── GET /api/users/me ─────────────────────────────────────────
// Returns the logged-in user's profile from Supabase.
const getMe = async (req, res, next) => {
  try {
    const { email } = req.user;

    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // Auto-create profile on first login
    if (!data) {
      const { data: created, error: createError } = await supabase
        .from('users')
        .insert([{
          email,
          name: req.user.name,
          handle: '@' + email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase(),
          rank: 'NEWBIE',
          level: 1,
          xp: 0,
          xp_max: 1000,
          joined: new Date().toISOString(),
        }])
        .select()
        .single();

      if (createError) throw createError;
      data = created;
    }

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ user: data });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/profile/:email ─────────────────────────────
// Public endpoint to fetch user profile by email (for Meet the Builders).
const getProfileByEmail = async (req, res, next) => {
  try {
    const { email } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('name, avatar_url, handle, rank')
      .eq('email', decodeURIComponent(email))
      .single();

    if (error && error.code === 'PGRST116') {
      // User not found
      return res.json({ name: null, avatar_url: null });
    }

    if (error) throw error;

    res.json(data || { name: null, avatar_url: null });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/users/me ───────────────────────────────────────
// Update the logged-in user's profile (name, bio, avatar_url, links).
const updateMe = async (req, res, next) => {
  try {
    const { email } = req.user;
    const { name, bio, avatar_url, twitter_url, github_url, website_url } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({
        ...(name        && { name }),
        ...(bio         && { bio }),
        ...(avatar_url  && { avatar_url }),
        ...(twitter_url && { twitter_url }),
        ...(github_url  && { github_url }),
        ...(website_url && { website_url }),
        updated_at: new Date().toISOString(),
      })
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Profile updated.', user: data });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/me/stats ───────────────────────────────────
// Returns aggregated dashboard stats for the logged-in user.
const getMyStats = async (req, res, next) => {
  try {
    const { email } = req.user;

    // Fetch all user's projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('votes, views, comments_count')
      .eq('author_email', email);

    if (error) throw error;

    const totalViews    = projects.reduce((acc, p) => acc + (p.views || 0), 0);
    const totalVotes    = projects.reduce((acc, p) => acc + (p.votes || 0), 0);
    const totalComments = projects.reduce((acc, p) => acc + (p.comments_count || 0), 0);
    const totalProjects = projects.length;

    res.json({
      stats: {
        totalViews,
        totalVotes,
        totalComments,
        totalProjects,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/leaderboard ────────────────────────────────
// Returns top users sorted by total votes across their projects.
const getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('leaderboard_view')   // a DB view that aggregates votes per user
      .select('*')
      .order('total_votes', { ascending: false })
      .limit(Number(limit));

    if (error) {
      // Fallback: compute manually if view doesn't exist yet
      const { data: projects } = await supabase
        .from('projects')
        .select('author_email, author_name, votes')
        .eq('status', 'approved');

      const map = {};
      (projects || []).forEach(p => {
        if (!map[p.author_email]) {
          map[p.author_email] = { email: p.author_email, name: p.author_name, total_votes: 0 };
        }
        map[p.author_email].total_votes += p.votes || 0;
      });

      const leaderboard = Object.values(map)
        .sort((a, b) => b.total_votes - a.total_votes)
        .slice(0, Number(limit));

      return res.json({ leaderboard });
    }

    res.json({ leaderboard: data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, getProfileByEmail, updateMe, getMyStats, getLeaderboard };
