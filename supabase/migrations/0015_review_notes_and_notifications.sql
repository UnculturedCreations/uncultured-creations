-- =====================================================================
-- Review notes and notifications
-- * Editors must give a reason or note when declining a story or chapter;
--   only the writer and editors can read it.
-- * In-app notifications, created automatically by the database when:
--   a story or chapter is published or declined, someone comments on your
--   story, or a prediction you made gets its result (or a correction).
-- Apply once, after 0014: SQL Editor -> paste -> Run.
-- =====================================================================

create table public.review_notes (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references public.fan_stories (id) on delete cascade,
  chapter_id uuid references public.story_chapters (id) on delete cascade,
  reasons    text[] not null default '{}' check (reasons <@ array['sexual_content', 'harassment', 'presented_as_fact', 'not_original', 'children', 'too_short', 'cover_image', 'other']),
  note       text check (char_length(note) <= 1000),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (cardinality(reasons) > 0 or char_length(trim(coalesce(note, ''))) >= 10)
);
create index review_notes_story on public.review_notes (story_id, created_at desc);
alter table public.review_notes enable row level security;
create policy "Writers and editors read review notes" on public.review_notes for select to authenticated
  using (public.is_editor() or exists (select 1 from public.fan_stories s where s.id = story_id and s.author_id = auth.uid()));
create policy "Editors write review notes" on public.review_notes for insert to authenticated with check (public.is_editor());
revoke all on public.review_notes from anon, authenticated;
grant select, insert on public.review_notes to authenticated;

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('story_published', 'story_declined', 'chapter_published', 'chapter_declined', 'story_comment', 'prediction_result', 'prediction_corrected')),
  title      text not null check (char_length(title) <= 160),
  body       text check (char_length(body) <= 300),
  link       text check (link ~ '^/'),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "Fans read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Fans mark own notifications read" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Fans clear own notifications" on public.notifications for delete to authenticated using (user_id = auth.uid());
revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function public.notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select p_user, p_kind, left(p_title, 160), left(p_body, 300), p_link where p_user is not null
$$;
revoke execute on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;

-- Story published or declined.
create or replace function public.notify_story_decision()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.author_id is null or new.status = old.status then return null; end if;
  if new.status = 'approved' then
    perform public.notify(new.author_id, 'story_published', format('"%s" is published!', new.title), 'Readers can now find it on Reality Reloaded.', '/fanzone/fiction/' || new.slug);
  elsif new.status = 'declined' then
    perform public.notify(new.author_id, 'story_declined', format('"%s" wasn''t published', new.title), 'An editor left a note. Make changes and resubmit from My stories.', '/account/stories');
  end if;
  return null;
end $$;
create trigger fan_stories_notify after update of status on public.fan_stories for each row execute function public.notify_story_decision();

-- Chapter published or declined.
create or replace function public.notify_chapter_decision()
returns trigger language plpgsql security definer set search_path = public as $$
declare s record;
begin
  if new.status = old.status then return null; end if;
  select author_id, title, slug into s from public.fan_stories where id = new.story_id;
  if s.author_id is null then return null; end if;
  if new.status = 'approved' then
    perform public.notify(s.author_id, 'chapter_published', format('Chapter %s of "%s" is published!', new.number, s.title), null, format('/fanzone/fiction/%s/chapter/%s', s.slug, new.number));
  elsif new.status = 'declined' then
    perform public.notify(s.author_id, 'chapter_declined', format('Chapter %s of "%s" wasn''t published', new.number, s.title), 'An editor left a note. Make changes and resubmit from My stories.', '/account/stories');
  end if;
  return null;
end $$;
create trigger story_chapters_notify after update of status on public.story_chapters for each row execute function public.notify_chapter_decision();

-- New comment on your story (not your own comment).
create or replace function public.notify_story_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare s record; commenter text;
begin
  select author_id, title, slug into s from public.fan_stories where id = new.story_id;
  if s.author_id is null or s.author_id = new.user_id then return null; end if;
  select display_name into commenter from public.profiles where id = new.user_id;
  perform public.notify(s.author_id, 'story_comment', format('%s commented on "%s"', coalesce(commenter, 'A fan'), s.title), left(new.body, 140), '/fanzone/fiction/' || s.slug);
  return null;
end $$;
create trigger story_comments_notify after insert on public.story_comments for each row execute function public.notify_story_comment();

-- Prediction results: everyone who played hears how they did (and about corrections).
create or replace function public.resolve_round(p_round_id uuid, p_correct uuid[])
returns text language plpgsql security definer set search_path = public as $$
declare r record; was_resolved boolean; v_link text;
begin
  if not public.is_editor() then return 'forbidden'; end if;
  if coalesce(cardinality(p_correct), 0) = 0 then return 'invalid'; end if;
  if exists (select 1 from unnest(p_correct) c where c not in (select id from public.prediction_options where round_id = p_round_id)) then
    return 'invalid';
  end if;
  select (status = 'resolved') into was_resolved from public.prediction_rounds where id = p_round_id;
  update public.prediction_options set is_correct = (id = any (p_correct)) where round_id = p_round_id;
  update public.prediction_rounds set status = 'resolved', resolved_at = now() where id = p_round_id;
  select pr.question, pr.points, sh.slug into r from public.prediction_rounds pr join public.shows sh on sh.id = pr.show_id where pr.id = p_round_id;
  v_link := '/fanzone/' || r.slug || '#predictions';
  insert into public.notifications (user_id, kind, title, body, link)
  select p.user_id,
         case when was_resolved then 'prediction_corrected' else 'prediction_result' end,
         left(case when was_resolved then 'Result corrected: ' else '' end
              || case when o.is_correct then format('You called it! +%s points', r.points) else 'Not this time' end, 160),
         left(r.question, 300),
         v_link
  from public.predictions p join public.prediction_options o on o.id = p.option_id
  where p.round_id = p_round_id;
  return 'ok';
end $$;
revoke execute on function public.resolve_round(uuid, uuid[]) from public, anon;
grant execute on function public.resolve_round(uuid, uuid[]) to authenticated;

revoke execute on function public.notify_story_decision(), public.notify_chapter_decision(), public.notify_story_comment() from public, anon, authenticated;
