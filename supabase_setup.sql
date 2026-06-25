-- ============================================================
--  DevJam — Supabase Database Setup
--  Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── USERS ────────────────────────────────────────────────────
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text,
  handle      text,
  bio         text,
  avatar_url  text,
  twitter_url text,
  github_url  text,
  website_url text,
  rank        text default 'NEWBIE',
  level       int  default 1,
  xp          int  default 0,
  xp_max      int  default 1000,
  joined      timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── PROJECTS ─────────────────────────────────────────────────
create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  tagline         text not null,
  description     text default '',
  url             text not null,
  github_url      text,
  category        text default 'other',
  tags            text[] default '{}',
  tech_stack      text[] default '{}',
  author_email    text not null references users(email),
  author_name     text,
  status          text default 'pending',   -- pending | approved | rejected
  votes           int  default 0,
  views           int  default 0,
  comments_count  int  default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── VOTES ────────────────────────────────────────────────────
create table if not exists votes (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete cascade,
  user_email  text not null,
  created_at  timestamptz default now(),
  unique(project_id, user_email)   -- one vote per user per project
);

-- ── COMMENTS ─────────────────────────────────────────────────
create table if not exists comments (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id) on delete cascade,
  author_email  text not null,
  author_name   text,
  text          text not null,
  created_at    timestamptz default now()
);

-- ── STORED PROCEDURES ────────────────────────────────────────

-- Increment views
create or replace function increment_views(project_id uuid)
returns void language sql as $$
  update projects set views = views + 1 where id = project_id;
$$;

-- Increment votes
create or replace function increment_votes(project_id uuid)
returns void language sql as $$
  update projects set votes = votes + 1 where id = project_id;
$$;

-- Increment comments count
create or replace function increment_comments(project_id uuid)
returns void language sql as $$
  update projects set comments_count = comments_count + 1 where id = project_id;
$$;

-- Decrement comments count
create or replace function decrement_comments(project_id uuid)
returns void language sql as $$
  update projects set comments_count = greatest(0, comments_count - 1) where id = project_id;
$$;

-- ── LEADERBOARD VIEW ─────────────────────────────────────────
create or replace view leaderboard_view as
  select
    p.author_email as email,
    p.author_name  as name,
    sum(p.votes)   as total_votes,
    count(p.id)    as total_projects,
    sum(p.views)   as total_views
  from projects p
  where p.status = 'approved'
  group by p.author_email, p.author_name
  order by total_votes desc;

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
-- Allow public reads on approved projects
alter table projects enable row level security;
create policy "Public can read approved projects"
  on projects for select using (status = 'approved');

-- Users can insert/update/delete their own projects
create policy "Users manage own projects"
  on projects for all using (auth.email() = author_email);

-- Public read on users
alter table users enable row level security;
create policy "Public read users"
  on users for select using (true);

create policy "Users manage own profile"
  on users for all using (auth.email() = email);

-- Public read on comments
alter table comments enable row level security;
create policy "Public read comments"
  on comments for select using (true);

create policy "Users manage own comments"
  on comments for all using (auth.email() = author_email);

-- Votes are insert-only by authenticated users
alter table votes enable row level security;
create policy "Authenticated can vote"
  on votes for insert using (true);

create policy "Users read own votes"
  on votes for select using (auth.email() = user_email);
