/**
 * controllers/uploadController.js
 * Handles image uploads to Supabase storage.
 */

const { supabase } = require('../supabase');
const path = require('path');

// ── POST /api/upload ─────────────────────────────────────────
const uploadImage = async (req, res, next) => {
  try {
    const { email } = req.user;
    const { type } = req.body; // 'profile' or 'thumbnail'

    console.log('=== UPLOAD REQUEST ===');
    console.log('Email:', email);
    console.log('Type:', type);
    console.log('Has file:', !!req.file);
    console.log('Headers:', req.headers);
    console.log('User:', req.user);

    if (!req.file) {
      console.error('❌ No file provided');
      return res.status(400).json({ error: 'No file provided.' });
    }

    const file = req.file;
    console.log('File details:', { name: file.originalname, size: file.size, mime: file.mimetype });

    // Validate file type
    const validMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!validMimes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only PNG, JPG, WEBP, GIF allowed.' });
    }

    // Validate file size (5MB for profile, 8MB for thumbnail)
    const maxSize = type === 'profile' ? 5 * 1024 * 1024 : 8 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({ error: `File too large. Max ${maxSize / 1024 / 1024}MB.` });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    const bucket = type === 'profile' ? 'profile-images' : 'project-thumbnails';
    const filename = `${email}_${timestamp}_${randomStr}${ext}`;

    console.log('Uploading to Supabase:', { bucket, filename });

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      console.error('Error details:', { message: error.message, status: error.status });
      return res.status(500).json({ error: `Upload failed: ${error.message || 'Unknown error'}` });
    }

    console.log('✅ Supabase upload success:', data);

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    console.log('✅ Public URL:', publicUrl.publicUrl);

    res.json({ url: publicUrl.publicUrl, filename });
  } catch (err) {
    console.error('❌ Upload controller error:', err);
    next(err);
  }
};

module.exports = {
  uploadImage,
};
