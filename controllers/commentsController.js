/**
 * controllers/commentsController.js
 * Handles comments on projects.
 */

const { supabase } = require('../supabase');

// ── GET /api/projects/:id/comments ───────────────────────────
const getComments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ comments: data || [] });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/projects/:id/comments ──────────────────────────
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, name } = req.user;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({ error: 'Comment must be under 1000 characters.' });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([{
        project_id: id,
        author_email: email,
        author_name: name,
        text: text.trim(),
      }])
      .select()
      .single();

    if (error) throw error;

    // Increment comment count on project
    await supabase.rpc('increment_comments', { project_id: id });

    res.status(201).json({ message: 'Comment added.', comment: data });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/comments/:commentId ──────────────────────────
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { email } = req.user;

    const { data: existing } = await supabase
      .from('comments')
      .select('author_email, project_id')
      .eq('id', commentId)
      .single();

    if (!existing || existing.author_email !== email) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw error;

    // Decrement comment count on project
    await supabase.rpc('decrement_comments', { project_id: existing.project_id });

    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, addComment, deleteComment };
