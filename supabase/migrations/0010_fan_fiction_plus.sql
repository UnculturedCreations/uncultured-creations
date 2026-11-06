-- =====================================================================
-- Fan fiction, part 2: covers, genres, content notes, reactions,
-- editor's picks and weekly writing prompts.
-- Apply once, after 0009: SQL Editor -> paste -> Run.
-- =====================================================================

-- Weekly writing prompts --------------------------------------------------
create table public.writing_prompts (
  id         uuid primary key default gen_random_uuid(),
  show_id    uuid references public.shows (id) on delete set null,
  title      text not null check (char_length(trim(title)) between 1 and 100),
  prompt     text not null check (char_length(trim(prompt)) between 1 and 500),
  status     text not null default 'active' check (status in ('draft', 'active', 'closed')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger writing_prompts_updated_at before update on public.writing_prompts for each row execute function public.set_updated_at();
alter table public.writing_prompts enable row level security;
create policy "Anyone can read live prompts" on public.writing_prompts for select using (status in ('active', 'closed') or public.is_editor());
create policy "Editors manage prompts" on public.writing_prompts for all to authenticated using (public.is_editor()) with check (public.is_editor());
grant select on public.writing_prompts to anon, authenticated;
grant insert, update, delete on public.writing_prompts to authenticated;

-- Story extras --------------------------------------------------------------
alter table public.fan_stories
  add column genres         text[] not null default '{other}'
    check (cardinality(genres) between 1 and 3
           and genres <@ array['romance', 'drama', 'comedy', 'thriller', 'what_if', 'friendship', 'other']),
  add column content_notes  text[] not null default '{}'
    check (cardinality(content_notes) <= 4
           and content_notes <@ array['strong_language', 'violence', 'heartbreak', 'mature_themes']),
  add column cover_url      text check (cover_url ~ '^https://'),
  add column featured       boolean not null default false,
  add column prompt_id      uuid references public.writing_prompts (id) on delete set null,
  add column reaction_total int not null default 0 check (reaction_total >= 0),
  -- Kept up to date automatically; used for "6 min read" without loading the whole story.
  add column word_count     int generated always as (coalesce(array_length(regexp_split_to_array(trim(body), '\s+'), 1), 0)) stored;
-- Existing stories are filed under "other"; new submissions must choose their genres.
alter table public.fan_stories alter column genres drop default;

-- Reactions: one per device per story, counted into fan_stories.reaction_total.
create table public.fan_story_reactions (
  story_id   uuid not null references public.fan_stories (id) on delete cascade,
  voter_hash text not null check (char_length(voter_hash) = 64),
  reaction   text not null check (reaction in ('love', 'laugh', 'wow', 'sad', 'fire')),
  created_at timestamptz not null default now(),
  primary key (story_id, voter_hash)
);
alter table public.fan_story_reactions enable row level security; -- no policies: no direct access
revoke all on public.fan_story_reactions from anon, authenticated;

create or replace function public.refresh_reaction_total()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_story uuid := coalesce(new.story_id, old.story_id);
begin
  update public.fan_stories set reaction_total = (select count(*) from public.fan_story_reactions where story_id = v_story) where id = v_story;
  return null;
end $$;
create trigger fan_story_reactions_total after insert or update or delete on public.fan_story_reactions
  for each row execute function public.refresh_reaction_total();
revoke execute on function public.refresh_reaction_total() from public, anon, authenticated;

-- Public counts for an approved story.
create or replace function public.story_reactions(p_story_id uuid)
returns table (reaction text, total bigint)
language sql stable security definer set search_path = public as $$
  select r.reaction, count(*) from public.fan_story_reactions r
  join public.fan_stories s on s.id = r.story_id
  where r.story_id = p_story_id and s.status = 'approved'
  group by r.reaction
$$;
grant execute on function public.story_reactions(uuid) to anon, authenticated;

-- Called only by the react Edge Function (after a Turnstile check).
create or replace function public.record_story_reaction(p_story_id uuid, p_reaction text, p_device_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_hash text;
begin
  if p_device_id is null or p_device_id !~ '^[A-Za-z0-9-]{16,64}$' or p_reaction not in ('love', 'laugh', 'wow', 'sad', 'fire') then
    return jsonb_build_object('status', 'invalid');
  end if;
  if not exists (select 1 from public.fan_stories where id = p_story_id and status = 'approved') then
    return jsonb_build_object('status', 'invalid');
  end if;
  v_hash := encode(sha256(convert_to(p_story_id::text || ':' || p_device_id, 'UTF8')), 'hex');
  insert into public.fan_story_reactions (story_id, voter_hash, reaction) values (p_story_id, v_hash, p_reaction)
  on conflict (story_id, voter_hash) do update set reaction = excluded.reaction, created_at = now();
  return jsonb_build_object('status', 'ok', 'counts',
    coalesce((select jsonb_object_agg(reaction, total) from public.story_reactions(p_story_id)), '{}'::jsonb));
end $$;
revoke execute on function public.record_story_reaction(uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_story_reaction(uuid, text, text) to service_role;

-- Submissions now carry genres, content notes, a prompt and an optional cover.
drop function if exists public.record_fan_story(uuid, text, text, text, text, text);
create or replace function public.record_fan_story(
  p_show_id uuid, p_title text, p_pen_name text, p_blurb text, p_body text, p_email text,
  p_genres text[], p_content_notes text[], p_prompt_id uuid, p_cover_url text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_id   uuid;
  v_slug text;
begin
  if p_prompt_id is not null and not exists (select 1 from public.writing_prompts where id = p_prompt_id and status = 'active') then
    p_prompt_id := null; -- the prompt has closed since the writer started; keep the story anyway
  end if;
  v_slug := trim(both '-' from left(regexp_replace(lower(coalesce(p_title, '')), '[^a-z0-9]+', '-', 'g'), 60));
  v_slug := case when v_slug = '' then '' else v_slug || '-' end || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
  insert into public.fan_stories (show_id, slug, title, pen_name, blurb, body, genres, content_notes, prompt_id, cover_url)
  values (p_show_id, v_slug, trim(p_title), trim(p_pen_name), nullif(trim(p_blurb), ''), trim(p_body),
          coalesce(p_genres, '{}'), coalesce(p_content_notes, '{}'), p_prompt_id, nullif(p_cover_url, ''))
  returning id into v_id;
  if nullif(trim(p_email), '') is not null then
    insert into public.fan_story_contacts (story_id, email) values (v_id, lower(trim(p_email)));
  end if;
  return 'ok';
exception when check_violation or foreign_key_violation then
  return 'invalid';
end $$;
revoke execute on function public.record_fan_story(uuid, text, text, text, text, text, text[], text[], uuid, text) from public, anon, authenticated;
grant execute on function public.record_fan_story(uuid, text, text, text, text, text, text[], text[], uuid, text) to service_role;

-- Covers: public bucket; the submit-story function uploads with the secret key;
-- editors can replace or remove covers.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fan-covers', 'fan-covers', true, 512000, array['image/jpeg'])
on conflict (id) do nothing;
create policy "Editors upload fan covers" on storage.objects for insert to authenticated
  with check (bucket_id = 'fan-covers' and public.is_editor());
create policy "Editors read fan cover records" on storage.objects for select to authenticated
  using (bucket_id = 'fan-covers' and public.is_editor());
create policy "Editors delete fan covers" on storage.objects for delete to authenticated
  using (bucket_id = 'fan-covers' and public.is_editor());
