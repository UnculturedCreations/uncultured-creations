-- =====================================================================
-- Predictions and leaderboards
-- Editors run prediction rounds (e.g. "Who will be evicted on Sunday?").
-- Signed-in fans (18+, name confirmed) make one pick per round, changeable
-- until the round locks. When editors mark the correct answer(s), points
-- count towards the season leaderboard. Points are always calculated from
-- the current answers, so corrections update the leaderboard automatically.
-- Apply once, after 0011: SQL Editor -> paste -> Run.
-- =====================================================================

create table public.prediction_rounds (
  id          uuid primary key default gen_random_uuid(),
  show_id     uuid not null references public.shows (id) on delete cascade,
  season_id   uuid references public.seasons (id) on delete set null,
  question    text not null check (char_length(trim(question)) between 1 and 200),
  points      int not null default 10 check (points between 1 and 100),
  locks_at    timestamptz not null,
  status      text not null default 'draft' check (status in ('draft', 'open', 'resolved')),
  resolved_at timestamptz,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index prediction_rounds_show on public.prediction_rounds (show_id, locks_at desc);
create trigger prediction_rounds_updated_at before update on public.prediction_rounds for each row execute function public.set_updated_at();

create table public.prediction_options (
  id           uuid primary key default gen_random_uuid(),
  round_id     uuid not null references public.prediction_rounds (id) on delete cascade,
  label        text not null check (char_length(trim(label)) between 1 and 120),
  housemate_id uuid references public.housemates (id) on delete set null,
  sort_order   int not null default 0,
  is_correct   boolean not null default false,
  unique (id, round_id)
);

create table public.predictions (
  round_id   uuid not null,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  option_id  uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (round_id, user_id),
  foreign key (option_id, round_id) references public.prediction_options (id, round_id) on delete cascade
);
create trigger predictions_updated_at before update on public.predictions for each row execute function public.set_updated_at();

-- Can the signed-in fan play? (18+ confirmed and fan name confirmed.)
create or replace function public.can_play()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and adult_confirmed_at is not null and name_confirmed)
$$;
grant execute on function public.can_play() to anon, authenticated;

-- Is a round taking picks right now?
create or replace function public.round_is_open(p_round_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.prediction_rounds where id = p_round_id and status = 'open' and locks_at > now())
$$;
grant execute on function public.round_is_open(uuid) to anon, authenticated;

alter table public.prediction_rounds  enable row level security;
alter table public.prediction_options enable row level security;
alter table public.predictions        enable row level security;

create policy "Anyone can read live rounds" on public.prediction_rounds for select
  using (status in ('open', 'resolved') or public.is_editor());
create policy "Editors manage rounds" on public.prediction_rounds for all to authenticated
  using (public.is_editor()) with check (public.is_editor());
create policy "Anyone can read options of live rounds" on public.prediction_options for select
  using (exists (select 1 from public.prediction_rounds r where r.id = round_id and (r.status in ('open', 'resolved') or public.is_editor())));
create policy "Editors manage options" on public.prediction_options for all to authenticated
  using (public.is_editor()) with check (public.is_editor());

-- Fans see and change only their own picks, and only while the round is open.
create policy "Fans read own picks" on public.predictions for select to authenticated
  using (user_id = auth.uid());
create policy "Fans make picks while open" on public.predictions for insert to authenticated
  with check (user_id = auth.uid() and public.can_play() and public.round_is_open(round_id));
create policy "Fans change picks while open" on public.predictions for update to authenticated
  using (user_id = auth.uid() and public.round_is_open(round_id))
  with check (user_id = auth.uid() and public.can_play() and public.round_is_open(round_id));
create policy "Fans withdraw picks while open" on public.predictions for delete to authenticated
  using (user_id = auth.uid() and public.round_is_open(round_id));

revoke all on public.prediction_rounds, public.prediction_options, public.predictions from anon, authenticated;
grant select on public.prediction_rounds, public.prediction_options to anon, authenticated;
grant insert, update, delete on public.prediction_rounds, public.prediction_options to authenticated;
grant select, insert, delete on public.predictions to authenticated;
grant update (option_id) on public.predictions to authenticated;

-- What fans predicted: totals per option, only once picks have locked.
create or replace function public.round_pick_counts(p_round_id uuid)
returns table (option_id uuid, picks bigint)
language sql stable security definer set search_path = public as $$
  select o.id, count(p.user_id)
  from public.prediction_options o
  join public.prediction_rounds r on r.id = o.round_id
  left join public.predictions p on p.option_id = o.id
  where o.round_id = p_round_id
    and (r.status = 'resolved' or (r.status = 'open' and r.locks_at <= now()) or public.is_editor())
  group by o.id
$$;
grant execute on function public.round_pick_counts(uuid) to anon, authenticated;

-- Season leaderboard: points from resolved rounds, ranked. Ties share a rank.
create or replace function public.season_leaderboard(p_show_id uuid, p_season_id uuid, p_limit int default 10)
returns table (rank bigint, fan_name text, points bigint, correct bigint, played bigint, is_me boolean)
language sql stable security definer set search_path = public as $$
  with scored as (
    select p.user_id,
           sum(case when o.is_correct then r.points else 0 end) as points,
           count(*) filter (where o.is_correct) as correct,
           count(*) as played
    from public.predictions p
    join public.prediction_rounds r on r.id = p.round_id
    join public.prediction_options o on o.id = p.option_id
    where r.status = 'resolved' and r.show_id = p_show_id
      and (p_season_id is null or r.season_id = p_season_id)
    group by p.user_id
  ), ranked as (
    select rank() over (order by s.points desc, s.correct desc) as rank, pr.display_name as fan_name,
           s.points, s.correct, s.played, (s.user_id = auth.uid()) as is_me
    from scored s join public.profiles pr on pr.id = s.user_id
    where s.points > 0 or s.played > 0
  )
  select * from ranked
  where rank <= least(greatest(p_limit, 1), 100) or is_me
  order by rank, fan_name
$$;
grant execute on function public.season_leaderboard(uuid, uuid, int) to anon, authenticated;

-- Editors mark the correct answer(s); calling again corrects a mistake.
create or replace function public.resolve_round(p_round_id uuid, p_correct uuid[])
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.is_editor() then return 'forbidden'; end if;
  if coalesce(cardinality(p_correct), 0) = 0 then return 'invalid'; end if;
  if exists (select 1 from unnest(p_correct) c where c not in (select id from public.prediction_options where round_id = p_round_id)) then
    return 'invalid';
  end if;
  update public.prediction_options set is_correct = (id = any (p_correct)) where round_id = p_round_id;
  update public.prediction_rounds set status = 'resolved', resolved_at = now() where id = p_round_id;
  return 'ok';
end $$;
revoke execute on function public.resolve_round(uuid, uuid[]) from public, anon;
grant execute on function public.resolve_round(uuid, uuid[]) to authenticated;
