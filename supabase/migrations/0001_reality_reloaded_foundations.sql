-- =====================================================================
-- Reality Reloaded: database foundations
-- Shows, seasons, housemates, schedule, posts (news/gossip/recaps),
-- rankings, polls and quizzes, plus editor roles and security rules.
--
-- Apply once: Supabase dashboard -> SQL Editor -> paste -> Run.
-- Safe defaults: visitors can only READ published content; only editors
-- can create or change content; individual poll votes are never readable.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Profiles and roles (one row per signed-in user)
-- role: fan (default), editor (posts content), admin (manages editors)
-- Roles are changed by you in the Table Editor, never by users themselves.
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  role         text not null default 'fan' check (role in ('fan', 'editor', 'admin')),
  created_at   timestamptz not null default now()
);

create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('editor', 'admin')
  )
$$;

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Shows, seasons, housemates, schedule
-- ---------------------------------------------------------------------
create table public.shows (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null check (char_length(name) <= 80),
  short_name   text check (char_length(short_name) <= 20),
  country      text check (char_length(country) <= 40),
  status       text not null default 'coming_soon'
               check (status in ('live', 'upcoming', 'off_season', 'coming_soon')),
  tagline      text check (char_length(tagline) <= 160),
  accent_color text check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order   int not null default 0,
  is_sample    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.seasons (
  id          uuid primary key default gen_random_uuid(),
  show_id     uuid not null references public.shows (id) on delete cascade,
  name        text not null check (char_length(name) <= 80),
  starts_on   date,
  ends_on     date,
  is_current  boolean not null default false,
  winner_name text check (char_length(winner_name) <= 80),
  is_sample   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
-- At most one current season per show.
create unique index seasons_one_current_per_show on public.seasons (show_id) where is_current;

create table public.housemates (
  id         uuid primary key default gen_random_uuid(),
  season_id  uuid not null references public.seasons (id) on delete cascade,
  name       text not null check (char_length(name) <= 60),
  color      text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  status     text not null default 'in_house'
             check (status in ('in_house', 'evicted', 'walked', 'disqualified', 'winner')),
  exit_week  int check (exit_week > 0),
  bio        text check (char_length(bio) <= 500),
  sort_order int not null default 0,
  is_sample  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.show_events (
  id         uuid primary key default gen_random_uuid(),
  show_id    uuid not null references public.shows (id) on delete cascade,
  title      text not null check (char_length(title) <= 100),
  kind       text not null default 'live_show'
             check (kind in ('premiere', 'live_show', 'eviction', 'finale', 'other')),
  starts_at  timestamptz not null,
  is_sample  boolean not null default false,
  created_at timestamptz not null default now()
);
create index show_events_upcoming on public.show_events (starts_at);

-- ---------------------------------------------------------------------
-- Posts: news links, gossip, trending topics, recaps and scenarios
-- show_id null = a general post shown on the Reality Reloaded home.
-- News is a headline and summary in our own words plus a link to the source.
-- ---------------------------------------------------------------------
create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  show_id      uuid references public.shows (id) on delete set null,
  kind         text not null check (kind in ('news', 'gossip', 'trending', 'recap', 'scenario')),
  title        text not null check (char_length(title) <= 160),
  summary      text check (char_length(summary) <= 1000),
  body         text check (char_length(body) <= 20000),
  source_name  text check (char_length(source_name) <= 80),
  source_url   text check (source_url ~ '^https://'),
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author_id    uuid references public.profiles (id) on delete set null,
  is_sample    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (status = 'draft' or published_at is not null)
);
create index posts_published on public.posts (status, published_at desc);
create index posts_by_show on public.posts (show_id, published_at desc);

-- ---------------------------------------------------------------------
-- Rankings: categories per season (e.g. "Most tasks won") and each
-- housemate's running total. Rankings are these totals, sorted.
-- ---------------------------------------------------------------------
create table public.ranking_categories (
  id               uuid primary key default gen_random_uuid(),
  season_id        uuid not null references public.seasons (id) on delete cascade,
  name             text not null check (char_length(name) <= 60),
  description      text check (char_length(description) <= 200),
  higher_is_better boolean not null default true,
  sort_order       int not null default 0,
  is_sample        boolean not null default false,
  created_at       timestamptz not null default now()
);

create table public.housemate_stats (
  category_id  uuid not null references public.ranking_categories (id) on delete cascade,
  housemate_id uuid not null references public.housemates (id) on delete cascade,
  value        int not null default 0 check (value >= 0),
  updated_at   timestamptz not null default now(),
  primary key (category_id, housemate_id)
);

-- A stat must pair a housemate and a category from the same season.
create or replace function public.check_stat_season()
returns trigger language plpgsql as $$
begin
  if (select season_id from public.ranking_categories where id = new.category_id)
     is distinct from (select season_id from public.housemates where id = new.housemate_id) then
    raise exception 'Housemate and ranking category belong to different seasons';
  end if;
  return new;
end $$;

create trigger housemate_stats_same_season
  before insert or update on public.housemate_stats
  for each row execute function public.check_stat_season();

-- ---------------------------------------------------------------------
-- Polls. Votes are stored per device (hashed), one per poll.
-- Votes are cast through a protected function added in a later step,
-- which also checks for bots. Nobody can read individual votes.
-- ---------------------------------------------------------------------
create table public.polls (
  id           uuid primary key default gen_random_uuid(),
  show_id      uuid not null references public.shows (id) on delete cascade,
  season_id    uuid references public.seasons (id) on delete set null,
  question     text not null check (char_length(question) <= 200),
  status       text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  show_results text not null default 'after_vote'
               check (show_results in ('after_vote', 'always', 'after_close')),
  closes_at    timestamptz,
  created_by   uuid references public.profiles (id) on delete set null,
  is_sample    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.poll_options (
  id           uuid primary key default gen_random_uuid(),
  poll_id      uuid not null references public.polls (id) on delete cascade,
  label        text not null check (char_length(label) <= 120),
  housemate_id uuid references public.housemates (id) on delete set null,
  sort_order   int not null default 0,
  unique (id, poll_id)
);

create table public.poll_votes (
  id         bigint generated always as identity primary key,
  poll_id    uuid not null,
  option_id  uuid not null,
  voter_hash text not null check (char_length(voter_hash) between 32 and 128),
  created_at timestamptz not null default now(),
  unique (poll_id, voter_hash),
  -- The chosen option must belong to the same poll.
  foreign key (option_id, poll_id) references public.poll_options (id, poll_id) on delete cascade
);

-- Vote totals per option. Respects the poll's "show results" setting.
create or replace function public.poll_results(p_poll_id uuid)
returns table (option_id uuid, votes bigint)
language sql stable security definer set search_path = public as $$
  select o.id, count(v.id)
  from public.poll_options o
  join public.polls p on p.id = o.poll_id
  left join public.poll_votes v on v.option_id = o.id
  where o.poll_id = p_poll_id
    and (p.status in ('open', 'closed') or public.is_editor())
    and (p.show_results <> 'after_close' or p.status = 'closed' or public.is_editor())
  group by o.id
$$;

-- ---------------------------------------------------------------------
-- Quizzes (for fun; answers are visible to anyone who inspects the page)
-- ---------------------------------------------------------------------
create table public.quizzes (
  id           uuid primary key default gen_random_uuid(),
  show_id      uuid not null references public.shows (id) on delete cascade,
  title        text not null check (char_length(title) <= 120),
  description  text check (char_length(description) <= 300),
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by   uuid references public.profiles (id) on delete set null,
  is_sample    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (status = 'draft' or published_at is not null)
);

create table public.quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references public.quizzes (id) on delete cascade,
  prompt      text not null check (char_length(prompt) <= 300),
  explanation text check (char_length(explanation) <= 500),
  sort_order  int not null default 0
);

create table public.quiz_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  label       text not null check (char_length(label) <= 160),
  is_correct  boolean not null default false,
  sort_order  int not null default 0
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
create trigger shows_updated_at      before update on public.shows      for each row execute function public.set_updated_at();
create trigger seasons_updated_at    before update on public.seasons    for each row execute function public.set_updated_at();
create trigger housemates_updated_at before update on public.housemates for each row execute function public.set_updated_at();
create trigger posts_updated_at      before update on public.posts      for each row execute function public.set_updated_at();
create trigger polls_updated_at      before update on public.polls      for each row execute function public.set_updated_at();
create trigger quizzes_updated_at    before update on public.quizzes    for each row execute function public.set_updated_at();
create trigger housemate_stats_updated_at before update on public.housemate_stats for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row-level security: every table locked by default, then opened
-- deliberately. "Editor" means profiles.role is editor or admin.
-- ---------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.shows              enable row level security;
alter table public.seasons            enable row level security;
alter table public.housemates         enable row level security;
alter table public.show_events        enable row level security;
alter table public.posts              enable row level security;
alter table public.ranking_categories enable row level security;
alter table public.housemate_stats    enable row level security;
alter table public.polls              enable row level security;
alter table public.poll_options       enable row level security;
alter table public.poll_votes         enable row level security;
alter table public.quizzes            enable row level security;
alter table public.quiz_questions     enable row level security;
alter table public.quiz_options       enable row level security;

-- Reference data: readable by everyone, editable by editors.
create policy "Anyone can read shows"      on public.shows      for select using (true);
create policy "Anyone can read seasons"    on public.seasons    for select using (true);
create policy "Anyone can read housemates" on public.housemates for select using (true);
create policy "Anyone can read schedule"   on public.show_events for select using (true);
create policy "Anyone can read ranking categories" on public.ranking_categories for select using (true);
create policy "Anyone can read stats"      on public.housemate_stats for select using (true);

create policy "Editors manage shows"      on public.shows      for all to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage seasons"    on public.seasons    for all to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage housemates" on public.housemates for all to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage schedule"   on public.show_events for all to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage ranking categories" on public.ranking_categories for all to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage stats"      on public.housemate_stats for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- Posts: published and due posts are public; editors see drafts too.
create policy "Anyone can read published posts" on public.posts for select
  using ((status = 'published' and published_at <= now()) or public.is_editor());
create policy "Editors manage posts" on public.posts for all to authenticated
  using (public.is_editor()) with check (public.is_editor());

-- Polls: open and closed polls are public; drafts are editor-only.
create policy "Anyone can read live polls" on public.polls for select
  using (status in ('open', 'closed') or public.is_editor());
create policy "Anyone can read options of live polls" on public.poll_options for select
  using (exists (select 1 from public.polls p where p.id = poll_id and (p.status in ('open', 'closed') or public.is_editor())));
create policy "Editors manage polls" on public.polls for all to authenticated
  using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage poll options" on public.poll_options for all to authenticated
  using (public.is_editor()) with check (public.is_editor());
-- poll_votes: no policies at all, so no one can read or write it directly.

-- Quizzes: published quizzes are public; drafts are editor-only.
create policy "Anyone can read published quizzes" on public.quizzes for select
  using ((status = 'published' and published_at <= now()) or public.is_editor());
create policy "Anyone can read questions of published quizzes" on public.quiz_questions for select
  using (exists (select 1 from public.quizzes q where q.id = quiz_id
                 and ((q.status = 'published' and q.published_at <= now()) or public.is_editor())));
create policy "Anyone can read options of published quizzes" on public.quiz_options for select
  using (exists (select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id
                 where qq.id = question_id
                 and ((q.status = 'published' and q.published_at <= now()) or public.is_editor())));
create policy "Editors manage quizzes" on public.quizzes for all to authenticated
  using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage quiz questions" on public.quiz_questions for all to authenticated
  using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage quiz options" on public.quiz_options for all to authenticated
  using (public.is_editor()) with check (public.is_editor());

-- Profiles: users see their own; editors see all (to know who is who).
create policy "Users read own profile, editors read all" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_editor());
create policy "Users update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- Table privileges (RLS above decides which rows; these decide which actions)
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select on public.shows, public.seasons, public.housemates, public.show_events,
               public.posts, public.ranking_categories, public.housemate_stats,
               public.polls, public.poll_options,
               public.quizzes, public.quiz_questions, public.quiz_options
  to anon, authenticated;

grant insert, update, delete on public.shows, public.seasons, public.housemates, public.show_events,
               public.posts, public.ranking_categories, public.housemate_stats,
               public.polls, public.poll_options,
               public.quizzes, public.quiz_questions, public.quiz_options
  to authenticated;

-- Profiles: users may only change their display name, never their role.
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- poll_votes: no direct access for anyone except the protected vote function (later step).

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.check_stat_season() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.is_editor() to anon, authenticated;
grant execute on function public.poll_results(uuid) to anon, authenticated;
