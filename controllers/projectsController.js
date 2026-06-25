/**
 * controllers/projectsController.js
 * Handles all project CRUD operations against Supabase.
 */

const { supabase } = require('../supabase');

// ── GET /api/projects ─────────────────────────────────────────
// Returns all approved projects, sorted by votes descending.
const getAllProjects = async (req, res, next) => {
  try {
    const { category, sort = 'votes', limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('projects')
      .select('*');

    // Apply category filter if provided and not 'ALL'
    if (category && category !== 'ALL' && category !== 'all') {
      query = query.ilike('category', category); // Case-insensitive match
    }

    // Apply sorting BEFORE pagination for correct ordering
    if (sort === 'votes') {
      query = query.order('votes', { ascending: false });
    } else if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'views') {
      query = query.order('views', { ascending: false });
    } else {
      // Default to votes
      query = query.order('votes', { ascending: false });
    }

    // Apply pagination after sorting
    query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ projects: data, count: data.length });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/projects/:id ─────────────────────────────────────
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Increment view count
    await supabase.rpc('increment_views', { project_id: id });

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({ project: data });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/projects/user/me ─────────────────────────────────
// Returns projects submitted by the logged-in user.
const getUserProjects = async (req, res, next) => {
  try {
    const { email } = req.user;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('author_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ projects: data || [] });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/projects ────────────────────────────────────────
// Submit a new project (requires auth).
const createProject = async (req, res, next) => {
  try {
    const { email, name } = req.user;
    const { title, tagline, description, url, github_url, category, tags, tech_stack, thumbnail_url, avatar_url } = req.body;

    if (!title || !tagline || !url) {
      return res.status(400).json({ error: 'title, tagline, and url are required.' });
    }

    // If they uploaded a profile image during submission, update their user profile
    if (avatar_url) {
      await supabase.from('users').update({ avatar_url }).eq('email', email);
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{
        title,
        tagline,
        description: description || '',
        url,
        github_url: github_url || null,
        category: category || 'other',
        tags: tags || [],
        tech_stack: tech_stack || [],
        thumbnail_url: thumbnail_url || null,
        author_email: email,
        author_name: name,
        votes: 0,
        views: 0,
      }])
      .select()
      .single();

    if (error) throw error;

    // Check and award badges asynchronously (don't wait for it)
    setTimeout(() => {
      checkBadgesForUser(email).catch(err => console.error('Badge check failed:', err));
    }, 500);

    res.status(201).json({ message: 'Project submitted successfully!', project: data });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/projects/:id ───────────────────────────────────
// Edit your own project.
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.user;
    const { title, tagline, description, url, github_url, category, tags, tech_stack } = req.body;

    // Ensure the project belongs to the user
    const { data: existing } = await supabase
      .from('projects')
      .select('author_email')
      .eq('id', id)
      .single();

    if (!existing || existing.author_email !== email) {
      return res.status(403).json({ error: 'Forbidden: you do not own this project.' });
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ title, tagline, description, url, github_url, category, tags, tech_stack, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Project updated.', project: data });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/projects/:id ──────────────────────────────────
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.user;

    const { data: existing } = await supabase
      .from('projects')
      .select('author_email')
      .eq('id', id)
      .single();

    if (!existing || existing.author_email !== email) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Project deleted.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/projects/:id/vote ───────────────────────────────
const voteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.user;
    const { direction } = req.body; // 'up' or 'down'

    if (!direction || !['up', 'down'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid direction. Use "up" or "down".' });
    }

    // Check if user already voted for this project
    const { data: existing, error: checkError } = await supabase
      .from('votes')
      .select('id, direction')
      .eq('project_id', id)
      .eq('user_email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      throw checkError;
    }

    if (existing) {
      // User already voted
      if (existing.direction === direction) {
        // Same direction - remove vote (toggle off)
        await supabase.from('votes').delete().eq('id', existing.id);
      } else {
        // Different direction - change vote
        await supabase.from('votes').update({ direction }).eq('id', existing.id);
      }
    } else {
      // New vote
      await supabase.from('votes').insert([{ project_id: id, user_email: email, direction }]);
    }

    // Get updated vote counts
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('direction')
      .eq('project_id', id);

    if (votesError) throw votesError;

    const upVotes = votes?.filter(v => v.direction === 'up').length ?? 0;
    const downVotes = votes?.filter(v => v.direction === 'down').length ?? 0;
    const netVotes = upVotes - downVotes;

    // Update project votes count
    await supabase.from('projects').update({ votes: netVotes }).eq('id', id);

    res.json({ message: 'Vote recorded!', votes: netVotes, upVotes, downVotes });
  } catch (err) {
    next(err);
  }
};

// ── Helper function: Check and award badges ──────────────────
async function checkBadgesForUser(email) {
  try {
    // Get user's project stats
    const { data: projects } = await supabase
      .from('projects')
      .select('votes, views, tech_stack, id')
      .eq('author_email', email);

    const projectCount = projects?.length || 0;
    const totalVotes = projects?.reduce((sum, p) => sum + (p.votes || 0), 0) || 0;
    const totalViews = projects?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;

    // Count AI projects
    const aiProjectCount = projects?.filter(p =>
      p.tech_stack?.some(t => t.toLowerCase().includes('ai') || t.toLowerCase().includes('ml'))
    ).length || 0;

    // Get already earned badges
    const { data: earnedBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_email', email);

    const earnedBadgeIds = earnedBadges?.map(b => b.badge_id) || [];

    // Award badges based on conditions
    const awardedBadges = [];

    // Badge 1: First Launch (Submit first project)
    if (projectCount >= 1 && !earnedBadgeIds.includes(1)) {
      await supabase.from('user_badges').insert({ user_email: email, badge_id: 1 }).catch(() => {});
      awardedBadges.push(1);
    }

    // Badge 3: Community Star (100+ votes)
    if (totalVotes >= 100 && !earnedBadgeIds.includes(3)) {
      await supabase.from('user_badges').insert({ user_email: email, badge_id: 3 }).catch(() => {});
      awardedBadges.push(3);
    }

    // Badge 4: AI Pioneer (3+ AI projects)
    if (aiProjectCount >= 3 && !earnedBadgeIds.includes(4)) {
      await supabase.from('user_badges').insert({ user_email: email, badge_id: 4 }).catch(() => {});
      awardedBadges.push(4);
    }

    // Badge 6: Diamond Builder (500+ votes)
    if (totalVotes >= 500 && !earnedBadgeIds.includes(6)) {
      await supabase.from('user_badges').insert({ user_email: email, badge_id: 6 }).catch(() => {});
      awardedBadges.push(6);
    }

    // Badge 7: Global Reach (10K views)
    if (totalViews >= 10000 && !earnedBadgeIds.includes(7)) {
      await supabase.from('user_badges').insert({ user_email: email, badge_id: 7 }).catch(() => {});
      awardedBadges.push(7);
    }

    if (awardedBadges.length > 0) {
      console.log(`✓ Awarded ${awardedBadges.length} badge(s) to ${email}:`, awardedBadges);
    }

    return awardedBadges;
  } catch (err) {
    console.error('Error checking badges:', err);
  }
}

module.exports = {
  getAllProjects,
  getProjectById,
  getUserProjects,
  createProject,
  updateProject,
  deleteProject,
  voteProject,
};
