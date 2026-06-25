/**
 * controllers/badgesController.js
 * Handles badge earning, checking, and retrieval.
 */

const { supabase } = require('../supabase');

// ── GET /api/badges ──────────────────────────────────────────
// Get all available badges
const getAllBadges = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    res.json({ badges: data || [] });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/me/badges ─────────────────────────────────
// Get user's earned badges
const getUserBadges = async (req, res, next) => {
  try {
    const { email } = req.user;

    const { data, error } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at, badges(name, description, icon, color)')
      .eq('user_email', email)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    // Map the badges with their data
    const userBadges = data?.map(ub => ({
      badge_id: ub.badge_id,
      earned_at: ub.earned_at,
      ...ub.badges,
    })) || [];

    res.json({ badges: userBadges, count: userBadges.length });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/badges/check ──────────────────────────────────
// Check and award badges for the logged-in user
const checkAndAwardBadges = async (req, res, next) => {
  try {
    const { email } = req.user;

    // Get user's project stats
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('votes, views, tech_stack, id, created_at')
      .eq('author_email', email)
      .eq('status', 'approved');

    if (projError) throw projError;

    const projectCount = projects?.length || 0;
    const totalVotes = projects?.reduce((sum, p) => sum + (p.votes || 0), 0) || 0;
    const totalViews = projects?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;

    // Count AI projects
    const aiProjectCount = projects?.filter(p => 
      p.tech_stack?.includes('AI / ML') || 
      p.tech_stack?.includes('AI')
    ).length || 0;

    // Get user's rank
    const { data: leaderboard, error: lbError } = await supabase
      .from('projects')
      .select('author_email')
      .eq('status', 'approved')
      .order('votes', { ascending: false });

    if (lbError) throw lbError;

    const rankMap = {};
    leaderboard?.forEach((p, idx) => {
      if (!rankMap[p.author_email]) {
        rankMap[p.author_email] = idx + 1;
      }
    });
    const userRank = rankMap[email] || 999;

    // Get already earned badges
    const { data: earnedBadges, error: badgeError } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_email', email);

    if (badgeError) throw badgeError;
    const earnedBadgeIds = earnedBadges?.map(b => b.badge_id) || [];

    // Award badges based on conditions
    const awardedBadges = [];

    // Badge 1: First Launch (Submit first project)
    if (projectCount >= 1 && !earnedBadgeIds.includes(1)) {
      await supabase.from('user_badges').insert({
        user_email: email,
        badge_id: 1,
      });
      awardedBadges.push(1);
    }

    // Badge 3: Community Star (100+ votes)
    if (totalVotes >= 100 && !earnedBadgeIds.includes(3)) {
      await supabase.from('user_badges').insert({
        user_email: email,
        badge_id: 3,
      });
      awardedBadges.push(3);
    }

    // Badge 4: AI Pioneer (3+ AI projects)
    if (aiProjectCount >= 3 && !earnedBadgeIds.includes(4)) {
      await supabase.from('user_badges').insert({
        user_email: email,
        badge_id: 4,
      });
      awardedBadges.push(4);
    }

    // Badge 6: Diamond Builder (500+ votes)
    if (totalVotes >= 500 && !earnedBadgeIds.includes(6)) {
      await supabase.from('user_badges').insert({
        user_email: email,
        badge_id: 6,
      });
      awardedBadges.push(6);
    }

    // Badge 7: Global Reach (10K views)
    if (totalViews >= 10000 && !earnedBadgeIds.includes(7)) {
      await supabase.from('user_badges').insert({
        user_email: email,
        badge_id: 7,
      });
      awardedBadges.push(7);
    }

    // Badge 8: Hall of Fame (Top 10)
    if (userRank <= 10 && !earnedBadgeIds.includes(8)) {
      await supabase.from('user_badges').insert({
        user_email: email,
        badge_id: 8,
      });
      awardedBadges.push(8);
    }

    res.json({
      message: 'Badges checked',
      awarded: awardedBadges,
      stats: {
        projectCount,
        totalVotes,
        totalViews,
        aiProjectCount,
        userRank,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/users/me/streaks ────────────────────────────────
// Update user's voting streak (called after vote)
const updateStreak = async (req, res, next) => {
  try {
    const { email } = req.user;
    const today = new Date().toISOString().split('T')[0];

    // Check if user already voted today
    const { data: todayVote } = await supabase
      .from('daily_votes')
      .select('*')
      .eq('user_email', email)
      .eq('vote_date', today)
      .single();

    if (!todayVote) {
      // Record today's vote
      await supabase.from('daily_votes').insert({
        user_email: email,
        vote_date: today,
      });

      // Get user's streak
      let { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_email', email)
        .single();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (!streak) {
        // First vote ever
        await supabase.from('user_streaks').insert({
          user_email: email,
          current_streak: 1,
          longest_streak: 1,
          last_vote_date: today,
        });
      } else if (streak.last_vote_date === yesterdayStr) {
        // Streak continues
        const newStreak = streak.current_streak + 1;
        await supabase
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streak.longest_streak),
            last_vote_date: today,
          })
          .eq('user_email', email);

        // Check for "On Fire" badge (7-day streak)
        if (newStreak === 7) {
          await supabase.from('user_badges').insert({
            user_email: email,
            badge_id: 2,
          }).catch(() => {}); // Ignore if already earned
        }
      } else {
        // Streak broken, restart
        await supabase
          .from('user_streaks')
          .update({
            current_streak: 1,
            last_vote_date: today,
          })
          .eq('user_email', email);
      }
    }

    res.json({ message: 'Streak updated' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllBadges,
  getUserBadges,
  checkAndAwardBadges,
  updateStreak,
};
