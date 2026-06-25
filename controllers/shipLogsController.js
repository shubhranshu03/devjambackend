const { supabase } = require('../supabase');

/**
 * GET /api/shiplogs
 * Get all ship logs from all users (community feed, public)
 */
exports.getAllShipLogs = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from('shiplogs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      shiplogs: data || [],
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/shiplogs/:userEmail
 * Get all ship logs for a specific user
 */
exports.getShipLogs = async (req, res, next) => {
  try {
    const { userEmail } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from('shiplogs')
      .select('*', { count: 'exact' })
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      shiplogs: data || [],
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/shiplogs/me
 * Get current user's ship logs (requires auth)
 */
exports.getMyShipLogs = async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
      return res.status(401).json({ error: 'User email not found in headers' });
    }

    const { limit = 50, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from('shiplogs')
      .select('*', { count: 'exact' })
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      shiplogs: data || [],
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/shiplogs
 * Create a new ship log (requires auth)
 */
exports.createShipLog = async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
      return res.status(401).json({ error: 'User email not found in headers' });
    }

    const { content, imageUrl } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required and must be non-empty' });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({ error: 'Content must be 1000 characters or less' });
    }

    const { data, error } = await supabase
      .from('shiplogs')
      .insert({
        user_email: userEmail,
        content: content.trim(),
        image_url: imageUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Ship log created successfully',
      shiplog: data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/shiplogs/:id
 * Delete a ship log (requires auth, must be own log)
 */
exports.deleteShipLog = async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
      return res.status(401).json({ error: 'User email not found in headers' });
    }

    const { id } = req.params;

    // First, fetch the shiplog to verify ownership
    const { data: shiplog, error: fetchError } = await supabase
      .from('shiplogs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !shiplog) {
      return res.status(404).json({ error: 'Ship log not found' });
    }

    if (shiplog.user_email !== userEmail) {
      return res.status(403).json({ error: 'Unauthorized to delete this ship log' });
    }

    const { error } = await supabase
      .from('shiplogs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Ship log deleted successfully' });
  } catch (err) {
    next(err);
  }
};
