-- Add direction column to votes table to track up/down votes
-- Run this in Supabase SQL editor

ALTER TABLE votes ADD COLUMN IF NOT EXISTS direction VARCHAR(4) DEFAULT 'up' CHECK (direction IN ('up', 'down'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_votes_project_email_direction ON votes(project_id, user_email, direction);

-- Update existing votes to 'up' (assuming previous system was upvotes only)
UPDATE votes SET direction = 'up' WHERE direction IS NULL OR direction = '';
