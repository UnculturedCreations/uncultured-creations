-- =====================================================================
-- Comments on fan fiction
-- Signed-in fans (18+, name confirmed) comment on approved stories.
-- Comments appear straight away; a comment reported by 3 different fans is
-- hidden until an editor reviews it. Editors can restore or delete comments
-- and turn off commenting for a fan. Basic spam limits apply.
-- Apply once, after 0012: SQL Editor -> paste -> Run.
-- =====================================================================

alter table public.profiles add column can_comment boolean not null default true;

create table public.story_comments (
  id           uuid primary key default gen_random_uuid(),
  story_id     uuid not null references public.fan_stories (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  body         text not null check (char_length(trim(body)) between 1 and 1000),
  status       text not null default 'visible' check (status in ('visible', 'hidden')),
  report_count int not null default 0,
  created_at   timestamptz not null default now()
);
create index story_comments_story on public.story_comments (story_id, created_at);
create index story_comments_user on public.story_comments (user_id, created_at desc);

create table public.comment_reports (
  comment_id uuid not null references public.story_comments (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- Can this fan comment? (Set up, and commenting not turned off by an editor.)
create or replace function public.can_comment()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and adult_confirmed_at is not null and name_confirmed and can_comment)
$$;
grant execute on function public.can_comment() to anon, authenticated;

-- Spam limits: 5 comments a minute, and not the same comment twice within 10 minutes.
create or replace function public.check_comment_limits()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.story_comments where user_id = new.user_id and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'slow_down' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.story_comments where user_id = new.user_id and lower(trim(body)) = lower(trim(new.body)) and created_at > now() - interval '10 minutes') then
    raise exception 'duplicate' using errcode = 'P0001';
  end if;
  new.body := trim(new.body);
  return new;
end $$;
create trigger story_comments_limits before insert on public.story_comments for each row execute function public.check_comment_limits();

alter table public.story_comments enable row level security;
alter table public.comment_reports enable row level security;

create policy "Fans comment on approved stories" on public.story_comments for insert to authenticated
  with check (user_id = auth.uid() and status = 'visible' and report_count = 0 and public.can_comment()
              and exists (select 1 from public.fan_stories s where s.id = story_id and s.status = 'approved'));
create policy "Fans delete own comments" on public.story_comments for delete to authenticated using (user_id = auth.uid());
create policy "Fans read own comments" on public.story_comments for select to authenticated using (user_id = auth.uid());
create policy "Editors moderate comments" on public.story_comments for all to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Editors read reports" on public.comment_reports for select to authenticated using (public.is_editor());
create policy "Editors clear reports" on public.comment_reports for delete to authenticated using (public.is_editor());

revoke all on public.story_comments, public.comment_reports from anon, authenticated;
grant select, insert, delete on public.story_comments to authenticated;
grant update (status, report_count) on public.story_comments to authenticated;
grant select, delete on public.comment_reports to authenticated;

-- Public list: visible comments on an approved story, with the fan's name.
create or replace function public.story_comments_list(p_story_id uuid)
returns table (id uuid, body text, created_at timestamptz, fan_name text, is_mine boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.body, c.created_at, p.display_name, (c.user_id = auth.uid())
  from public.story_comments c
  join public.profiles p on p.id = c.user_id
  join public.fan_stories s on s.id = c.story_id
  where c.story_id = p_story_id and c.status = 'visible' and s.status = 'approved'
  order by c.created_at
  limit 500
$$;
grant execute on function public.story_comments_list(uuid) to anon, authenticated;

-- Report a comment (once per fan). Three different fans hide it until an editor reviews it.
create or replace function public.report_comment(p_comment_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if not public.can_comment() then return 'forbidden'; end if;
  if p_comment_id is null or not exists (select 1 from public.story_comments where id = p_comment_id) then return 'invalid'; end if;
  if exists (select 1 from public.story_comments where id = p_comment_id and user_id = auth.uid()) then return 'own'; end if;
  insert into public.comment_reports (comment_id, user_id) values (p_comment_id, auth.uid()) on conflict do nothing;
  select count(*) into v_count from public.comment_reports where comment_id = p_comment_id;
  update public.story_comments set report_count = v_count, status = case when v_count >= 3 then 'hidden' else status end where id = p_comment_id;
  return 'ok';
exception when foreign_key_violation then
  return 'invalid';
end $$;
revoke execute on function public.report_comment(uuid) from public, anon;
grant execute on function public.report_comment(uuid) to authenticated;

-- Editors turn commenting off or on for a fan.
create or replace function public.set_can_comment(p_user_id uuid, p_allowed boolean)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.is_editor() then return 'forbidden'; end if;
  update public.profiles set can_comment = p_allowed where id = p_user_id;
  return 'ok';
end $$;
revoke execute on function public.set_can_comment(uuid, boolean) from public, anon;
grant execute on function public.set_can_comment(uuid, boolean) to authenticated;

-- Editors see who wrote a comment (fan name) when moderating.
create or replace function public.moderation_comments(p_only_reported boolean)
returns table (id uuid, body text, status text, report_count int, created_at timestamptz,
               user_id uuid, fan_name text, can_comment boolean, story_title text, story_slug text)
language sql stable security definer set search_path = public as $$
  select c.id, c.body, c.status, c.report_count, c.created_at, c.user_id, p.display_name, p.can_comment, s.title, s.slug
  from public.story_comments c
  join public.profiles p on p.id = c.user_id
  join public.fan_stories s on s.id = c.story_id
  where public.is_editor() and (not p_only_reported or c.report_count > 0 or c.status = 'hidden')
  order by c.created_at desc
  limit 200
$$;
grant execute on function public.moderation_comments(boolean) to authenticated;
