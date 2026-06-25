-- ───────────────────────────────────────────────────────────────
-- SHIP LOGS TABLE
-- ───────────────────────────────────────────────────────────────
-- Daily ship updates: Users post what they built each day

CREATE TABLE IF NOT EXISTS shiplogs (
  id BIGINT PRIMARY KEY DEFAULT abs((random() * 9223372036854775807)::bigint),
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shiplogs_user_email ON shiplogs(user_email);
CREATE INDEX IF NOT EXISTS idx_shiplogs_created_at ON shiplogs(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE shiplogs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all shiplogs
CREATE POLICY "Public Read" ON shiplogs
  FOR SELECT USING (true);

-- Policy: Users can create their own shiplogs
CREATE POLICY "Users Insert Own" ON shiplogs
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Policy: Users can delete their own shiplogs
CREATE POLICY "Users Delete Own" ON shiplogs
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);
