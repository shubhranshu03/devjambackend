const { supabase } = require('../supabase');

/**
 * GET /api/shiplogs/:shiplogId/likes
 * Get like count for a ship log
 */
exports.getLikeCount = async (req, res, next) => {
  try {
    const { shiplogId } = req.params;

    const { count, error } = await supabase
      .from('shiplog_likes')
      .select('*', { count: 'exact', head: true })
      .eq('shiplog_id', shiplogId);

    if (error) throw error;

    res.json({ likes: count || 0 });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/shiplogs/:shiplogId/like
 * Like a ship log (requires auth)
 */
exports.likeShipLog = async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
      return res.status(401).json({ error: 'User email not found in headers' });
    }

    const { shiplogId } = req.params;

    // Check if already liked
    const { data: existing } = await supabase
      .from('shiplog_likes')
      .select('*')
      .eq('shiplog_id', shiplogId)
      .eq('user_email', userEmail)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Already liked' });
    }

    const { error } = await supabase
      .from('shiplog_likes')
      .insert({ shiplog_id: shiplogId, user_email: userEmail });

    if (error) throw error;

    // Get updated count
    const { count } = await supabase
      .from('shiplog_likes')
      .select('*', { count: 'exact', head: true })
      .eq('shiplog_id', shiplogId);

    res.json({ message: 'Liked', likes: count || 0 });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/shiplogs/:shiplogId/like
 * Unlike a ship log (requires auth)
 */
exports.unlikeShipLog = async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
      return res.status(401).json({ error: 'User email not found in headers' });
    }

    const { shiplogId } = req.params;

    const { error } = await supabase
      .from('shiplog_likes')
      .delete()
      .eq('shiplog_id', shiplogId)
      .eq('user_email', userEmail);

    if (error) throw error;

    // Get updated count
    const { count } = await supabase
      .from('shiplog_likes')
      .select('*', { count: 'exact', head: true })
      .eq('shiplog_id', shiplogId);

    res.json({ message: 'Unliked', likes: count || 0 });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/shiplogs/:shiplogId/comments
 * Get all comments for a ship log
 */
exports.getComments = async (req, res, next) => {
  try {
    const { shiplogId } = req.params;

    const { data, error, count } = await supabase
      .from('shiplog_comments')
      .select('*', { count: 'exact' })
      .eq('shiplog_id', shiplogId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      comments: data || [],
      total: count || 0,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/shiplogs/:shiplogId/comments
 * Add a comment to a ship log (requires auth)
 */
exports.addComment = async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
      return res.status(401).json({ error: 'User email not found in headers' });
    }

    const { shiplogId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({ error: 'Comment too long (max 500 chars)' });
    }

    const { data, error } = await supabase
      .from('shiplog_comments')
      .insert({
        shiplog_id: shiplogId,
        user_email: userEmail,
        content: content.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Comment added',
      comment: data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/shiplogs/comments/:commentId
 * Delete a comment (requires auth, must be own comment)
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
      return res.status(401).json({ error: 'User email not found in headers' });
    }

    const { commentId } = req.params;

    // Verify ownership
    const { data: comment, error: fetchErr } = await supabase
      .from('shiplog_comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (fetchErr || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_email !== userEmail) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from('shiplog_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/shiplogs/:shiplogId/liked
 * Check if current user liked this ship log (requires auth)
 */
exports.checkIfLiked = async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
      return res.json({ liked: false });
    }

    const { shiplogId } = req.params;

    const { data } = await supabase
      .from('shiplog_likes')
      .select('*')
      .eq('shiplog_id', shiplogId)
      .eq('user_email', userEmail)
      .single();

    res.json({ liked: !!data });
  } catch (err) {
    res.json({ liked: false });
  }
};
