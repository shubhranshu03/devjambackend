require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️ Supabase keys are missing! Please add them to your .env file.");
}

// Using the Service Key allows our custom Node.js backend to bypass RLS,
// because our backend uses NextAuth to secure routes instead of Supabase Auth.
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase };
