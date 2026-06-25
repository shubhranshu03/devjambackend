-- ============================================================
--  DevJam — Badges System Complete Schema
--  COPY & PASTE this entire block into Supabase SQL Editor
-- ============================================================

-- ── BADGES DEFINITIONS ───────────────────────────────────────
create table if not exists badges (
  id              int primary key,
  name            text not null,
  description     text,
  icon            text,
  color           text,
  requirement     text,
  created_at      timestamptz default now()
);

insert into badges (id, name, description, icon, color, requirement) values
  (1, 'First Launch', 'Submitted first project', 'rocket', '#cc44ff', 'Submit 1 project'),
  (2, 'On Fire', '7-day streak', 'flame', '#ff6600', 'Get votes on 7 consecutive days'),
  (3, 'Community Star', '100+ total votes', 'star', '#ffd700', 'Reach 100 total votes'),
  (4, 'AI Pioneer', '3 AI-powered projects', 'cpu', '#00d4ff', 'Submit 3 AI/ML projects'),
  (5, 'Jam Winner', 'Won a jam', 'trophy', '#aaff00', 'Win a jam competition'),
  (6, 'Diamond Builder', '500+ total votes', 'diamond', '#88eeff', 'Reach 500 total votes'),
  (7, 'Global Reach', '10K project views', 'globe2', '#ff4455', 'Reach 10,000 total views'),
  (8, 'Hall of Fame', 'Top 10 leaderboard', 'crown', '#ffd700', 'Rank in top 10')
on conflict (id) do nothing;

-- ── USER BADGES ──────────────────────────────────────────────
create table if not exists user_badges (
  id              uuid primary key default gen_random_uuid(),
  user_email      text not null references users(email) on delete cascade,
  badge_id        int not null references badges(id),
  earned_at       timestamptz default now(),
  unique(user_email, badge_id)
);

-- ── DAILY VOTES TRACKING ─────────────────────────────────────
create table if not exists daily_votes (
  id              uuid primary key default gen_random_uuid(),
  user_email      text not null references users(email) on delete cascade,
  vote_date       date default current_date,
  unique(user_email, vote_date)
);

-- ── STREAK TRACKING ──────────────────────────────────────────
create table if not exists user_streaks (
  user_email      text primary key references users(email) on delete cascade,
  current_streak  int default 0,
  longest_streak  int default 0,
  last_vote_date  date,
  updated_at      timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
alter table badges enable row level security;
create policy "Public read badges" on badges for select using (true);

alter table user_badges enable row level security;
create policy "Public read user badges" on user_badges for select using (true);
create policy "Users manage own badges" on user_badges for all using (auth.email() = user_email);

alter table daily_votes enable row level security;
create policy "Users manage own daily votes" on daily_votes for all using (auth.email() = user_email);

alter table user_streaks enable row level security;
create policy "Public read user streaks" on user_streaks for select using (true);
create policy "Users manage own streak" on user_streaks for all using (auth.email() = user_email);
