-- ============================================================
--  DevJam — Badges System Setup
--  Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── BADGES DEFINITIONS ───────────────────────────────────────
-- Master list of all available badges
create table if not exists badges (
  id              int primary key,
  name            text not null,
  description     text,
  icon            text,
  color           text,
  requirement     text,
  created_at      timestamptz default now()
);

-- Insert all badges
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
-- Track which badges each user has earned
create table if not exists user_badges (
  id              uuid primary key default gen_random_uuid(),
  user_email      text not null references users(email) on delete cascade,
  badge_id        int not null references badges(id),
  earned_at       timestamptz default now(),
  unique(user_email, badge_id)
);

-- ── DAILY VOTES TRACKING ─────────────────────────────────────
-- Track which users voted on which days for "On Fire" badge
create table if not exists daily_votes (
  id              uuid primary key default gen_random_uuid(),
  user_email      text not null references users(email) on delete cascade,
  vote_date       date default current_date,
  unique(user_email, vote_date)
);

-- ── STREAK TRACKING ──────────────────────────────────────────
-- Track current voting streak for each user
create table if not exists user_streaks (
  user_email      text primary key references users(email) on delete cascade,
  current_streak  int default 0,
  longest_streak  int default 0,
  last_vote_date  date,
  updated_at      timestamptz default now()
);

-- ── HELPER FUNCTIONS ─────────────────────────────────────────

-- Function to award a badge to a user
create or replace function award_badge(p_email text, p_badge_id int)
returns void language sql as $$
  insert into user_badges (user_email, badge_id)
  values (p_email, p_badge_id)
  on conflict (user_email, badge_id) do nothing;
$$;

-- Function to check and award all badges for a user
create or replace function check_all_badges(p_email text)
returns table (badge_id int, badge_name text, awarded boolean) language plpgsql as $$
declare
  v_total_votes int;
  v_total_views int;
  v_project_count int;
  v_ai_projects int;
  v_is_new boolean;
  v_rank_position int;
begin
  -- Get user stats
  select 
    coalesce(sum(p.votes), 0),
    coalesce(sum(p.views), 0),
    count(p.id)
  into v_total_votes, v_total_views, v_project_count
  from projects p
  where p.author_email = p_email and p.status = 'approved';

  -- Count AI projects
  select count(p.id) into v_ai_projects
  from projects p
  where p.author_email = p_email 
    and p.status = 'approved'
    and 'AI / ML' = any(p.tags);

  -- Check if first project (newly created)
  select (select count(*) from projects where author_email = p_email) = 1 into v_is_new;

  -- Get rank position
  select count(*) + 1 into v_rank_position
  from projects p
  where p.status = 'approved'
  group by p.author_email
  having sum(p.votes) > (
    select coalesce(sum(votes), 0) from projects where author_email = p_email and status = 'approved'
  );

  -- Check each badge
  for badge_id, badge_name in
    select b.id, b.name from badges b
  loop
    case badge_id
      when 1 then -- First Launch
        if v_is_new then
          perform award_badge(p_email, badge_id);
        end if;
      when 2 then -- On Fire
        if (select current_streak from user_streaks where user_email = p_email limit 1) >= 7 then
          perform award_badge(p_email, badge_id);
        end if;
      when 3 then -- Community Star
        if v_total_votes >= 100 then
          perform award_badge(p_email, badge_id);
        end if;
      when 4 then -- AI Pioneer
        if v_ai_projects >= 3 then
          perform award_badge(p_email, badge_id);
        end if;
      when 6 then -- Diamond Builder
        if v_total_votes >= 500 then
          perform award_badge(p_email, badge_id);
        end if;
      when 7 then -- Global Reach
        if v_total_views >= 10000 then
          perform award_badge(p_email, badge_id);
        end if;
      when 8 then -- Hall of Fame
        if v_rank_position <= 10 then
          perform award_badge(p_email, badge_id);
        end if;
    end case;
    
    awarded := exists(select 1 from user_badges where user_email = p_email and badge_id = badge_id);
    return next;
  end loop;
end;
$$;

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
