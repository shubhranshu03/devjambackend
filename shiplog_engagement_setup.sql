-- ───────────────────────────────────────────────────────────────
-- SHIP LOG LIKES TABLE
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shiplog_likes (
  id BIGSERIAL PRIMARY KEY,
  shiplog_id BIGINT NOT NULL,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(shiplog_id, user_email),
  FOREIGN KEY (shiplog_id) REFERENCES shiplogs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shiplog_likes ON shiplog_likes(shiplog_id);

-- Enable RLS
ALTER TABLE shiplog_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read likes
CREATE POLICY "Public Read Likes" ON shiplog_likes
  FOR SELECT USING (true);

-- Users can like
CREATE POLICY "Users Insert Likes" ON shiplog_likes
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Users can unlike their own likes
CREATE POLICY "Users Delete Own Likes" ON shiplog_likes
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- ───────────────────────────────────────────────────────────────
-- SHIP LOG COMMENTS TABLE
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shiplog_comments (
  id BIGSERIAL PRIMARY KEY,
  shiplog_id BIGINT NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (shiplog_id) REFERENCES shiplogs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shiplog_comments ON shiplog_comments(shiplog_id);
CREATE INDEX IF NOT EXISTS idx_shiplog_comments_created ON shiplog_comments(created_at DESC);

-- Enable RLS
ALTER TABLE shiplog_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Public Read Comments" ON shiplog_comments
  FOR SELECT USING (true);

-- Users can comment
CREATE POLICY "Users Insert Comments" ON shiplog_comments
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Users can delete their own comments
CREATE POLICY "Users Delete Own Comments" ON shiplog_comments
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);
