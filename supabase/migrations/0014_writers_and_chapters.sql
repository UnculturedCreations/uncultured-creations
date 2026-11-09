-- =====================================================================
-- Fan fiction writers and chapters
-- * New stories are submitted by signed-in fans and linked to their account.
-- * Writers see their own stories, edit or withdraw them while they wait for
--   review, resubmit declined ones, and add chapters to published stories.
-- * Every story and chapter is reviewed by an editor before it's public.
-- * Published stories can't be changed by their writer.
-- * Deleting an account deletes the writer's unpublished stories; published
--   ones stay under the pen name, no longer linked to the account.
-- Apply once, after 0013: SQL Editor -> paste -> Run.
-- =====================================================================

alter table public.fan_stories
  add column author_id     uuid references public.profiles (id) on delete set null,
  add column chapter_count int not null default 1 check (chapter_count >= 1),
  alter column slug drop not null;
create index fan_stories_author on public.fan_stories (author_id);

-- Chapters 2 onwards (the story's own text is chapter 1).
create table public.story_chapters (
  id           uuid primary key default gen_random_uuid(),
  story_id     uuid not null references public.fan_stories (id) on delete cascade,
  number       int not null check (number >= 2),
  title        text check (char_length(title) <= 100),
  body         text not null check (char_length(body) between 300 and 20000),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  published_at timestamptz,
  reviewed_by  uuid references public.profiles (id) on delete set null,
  word_count   int generated always as (coalesce(array_length(regexp_split_to_array(trim(body), '\s+'), 1), 0)) stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (story_id, number),
  check (status <> 'approved' or published_at is not null)
);
create trigger story_chapters_updated_at before update on public.story_chapters for each row execute function public.set_updated_at();

-- Writers: the database fills in or protects the fields only editors may set. ----------
create or replace function public.fan_story_writer_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Internal bookkeeping (e.g. chapter counts) isn't an edit by the writer.
  if current_setting('uc.internal_update', true) = 'on' then return new; end if;
  if public.is_editor() or auth.uid() is null then
    if new.slug is null then
      new.slug := trim(both '-' from left(regexp_replace(lower(new.title), '[^a-z0-9]+', '-', 'g'), 60));
      new.slug := case when new.slug = '' then '' else new.slug || '-' end || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    if (select count(*) from public.fan_stories where author_id = auth.uid() and status = 'pending') >= 3 then
      raise exception 'too_many_pending' using errcode = 'P0001';
    end if;
    new.author_id := auth.uid();
    new.slug := trim(both '-' from left(regexp_replace(lower(new.title), '[^a-z0-9]+', '-', 'g'), 60));
    new.slug := case when new.slug = '' then '' else new.slug || '-' end || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
  else
    if old.status = 'approved' then raise exception 'published_locked' using errcode = 'P0001'; end if;
    new.author_id := old.author_id;
    new.slug := old.slug;
  end if;
  new.status := 'pending';          -- editing a declined story resubmits it
  new.published_at := null;
  new.featured := false;
  new.reviewed_by := null;
  new.reaction_total := coalesce(old.reaction_total, 0);
  new.chapter_count := coalesce(old.chapter_count, 1);
  return new;
end $$;
create trigger fan_stories_writer_rules before insert or update on public.fan_stories for each row execute function public.fan_story_writer_rules();

create or replace function public.story_chapter_writer_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_editor() or auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then
    if (select count(*) from public.story_chapters c join public.fan_stories s on s.id = c.story_id
        where s.author_id = auth.uid() and c.status = 'pending') >= 3 then
      raise exception 'too_many_pending' using errcode = 'P0001';
    end if;
    new.number := coalesce((select max(number) from public.story_chapters where story_id = new.story_id), 1) + 1;
  else
    if old.status = 'approved' then raise exception 'published_locked' using errcode = 'P0001'; end if;
    new.number := old.number;
    new.story_id := old.story_id;
  end if;
  new.status := 'pending';
  new.published_at := null;
  new.reviewed_by := null;
  return new;
end $$;
create trigger story_chapters_writer_rules before insert or update on public.story_chapters for each row execute function public.story_chapter_writer_rules();

-- Keep each story's chapter count (1 + approved chapters) up to date.
create or replace function public.refresh_chapter_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_story uuid := coalesce(new.story_id, old.story_id);
begin
  perform set_config('uc.internal_update', 'on', true);
  update public.fan_stories set chapter_count = 1 + (select count(*) from public.story_chapters where story_id = v_story and status = 'approved') where id = v_story;
  perform set_config('uc.internal_update', 'off', true);
  return null;
end $$;
create trigger story_chapters_count after insert or update or delete on public.story_chapters for each row execute function public.refresh_chapter_count();

-- Reaction totals are bookkeeping too.
create or replace function public.refresh_reaction_total()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_story uuid := coalesce(new.story_id, old.story_id);
begin
  perform set_config('uc.internal_update', 'on', true);
  update public.fan_stories set reaction_total = (select count(*) from public.fan_story_reactions where story_id = v_story) where id = v_story;
  perform set_config('uc.internal_update', 'off', true);
  return null;
end $$;

-- Account deletion: unpublished stories go with the account.
create or replace function public.remove_unpublished_stories()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.fan_stories where author_id = old.id and status <> 'approved';
  return old;
end $$;
create trigger profiles_remove_unpublished_stories before delete on public.profiles for each row execute function public.remove_unpublished_stories();

revoke execute on function public.fan_story_writer_rules(), public.story_chapter_writer_rules(), public.refresh_chapter_count(), public.remove_unpublished_stories() from public, anon, authenticated;

-- Access rules ------------------------------------------------------------------------
create policy "Writers read own stories" on public.fan_stories for select to authenticated using (author_id = auth.uid());
create policy "Writers submit stories" on public.fan_stories for insert to authenticated
  with check (author_id = auth.uid() and status = 'pending' and public.can_play());
create policy "Writers edit own unpublished stories" on public.fan_stories for update to authenticated
  using (author_id = auth.uid() and status <> 'approved') with check (author_id = auth.uid() and public.can_play());
create policy "Writers withdraw own unpublished stories" on public.fan_stories for delete to authenticated
  using (author_id = auth.uid() and status <> 'approved');
grant insert on public.fan_stories to authenticated;

alter table public.story_chapters enable row level security;
create policy "Anyone can read published chapters" on public.story_chapters for select
  using ((status = 'approved' and published_at <= now() and exists (select 1 from public.fan_stories s where s.id = story_id and s.status = 'approved')) or public.is_editor());
create policy "Writers read own chapters" on public.story_chapters for select to authenticated
  using (exists (select 1 from public.fan_stories s where s.id = story_id and s.author_id = auth.uid()));
create policy "Writers add chapters to own published stories" on public.story_chapters for insert to authenticated
  with check (public.can_play() and exists (select 1 from public.fan_stories s where s.id = story_id and s.author_id = auth.uid() and s.status = 'approved'));
create policy "Writers edit own unpublished chapters" on public.story_chapters for update to authenticated
  using (status <> 'approved' and exists (select 1 from public.fan_stories s where s.id = story_id and s.author_id = auth.uid()))
  with check (exists (select 1 from public.fan_stories s where s.id = story_id and s.author_id = auth.uid()));
create policy "Writers withdraw own unpublished chapters" on public.story_chapters for delete to authenticated
  using (status <> 'approved' and exists (select 1 from public.fan_stories s where s.id = story_id and s.author_id = auth.uid()));
create policy "Editors manage chapters" on public.story_chapters for all to authenticated using (public.is_editor()) with check (public.is_editor());
revoke all on public.story_chapters from anon, authenticated;
grant select on public.story_chapters to anon, authenticated;
grant insert, update, delete on public.story_chapters to authenticated;

-- Writers upload covers into their own folder (writers/<their id>/...).
create policy "Writers upload own covers" on storage.objects for insert to authenticated
  with check (bucket_id = 'fan-covers' and (storage.foldername(name))[1] = 'writers' and (storage.foldername(name))[2] = auth.uid()::text and public.can_play());

-- Comment totals for a writer's own stories.
create or replace function public.my_story_comment_counts()
returns table (story_id uuid, comments bigint)
language sql stable security definer set search_path = public as $$
  select c.story_id, count(*) from public.story_comments c join public.fan_stories s on s.id = c.story_id
  where s.author_id = auth.uid() and c.status = 'visible' group by c.story_id
$$;
grant execute on function public.my_story_comment_counts() to authenticated;
