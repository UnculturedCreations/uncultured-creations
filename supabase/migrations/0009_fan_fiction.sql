-- =====================================================================
-- Reality Reloaded: fan fiction
-- Fans submit stories (no account) through the submit-story Edge Function
-- after a Turnstile check. Stories start as "pending" and are public only
-- once an editor approves them. The submitter's email (optional) is kept in
-- a separate table that only admins can read.
-- Apply once, after 0008: SQL Editor -> paste -> Run.
-- =====================================================================

create table public.fan_stories (
  id           uuid primary key default gen_random_uuid(),
  show_id      uuid references public.shows (id) on delete set null,
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title        text not null check (char_length(trim(title)) between 1 and 100),
  pen_name     text not null check (char_length(trim(pen_name)) between 1 and 40),
  blurb        text check (char_length(blurb) <= 300),
  body         text not null check (char_length(body) between 300 and 20000),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  published_at timestamptz,
  reviewed_by  uuid references public.profiles (id) on delete set null,
  is_sample    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (status <> 'approved' or published_at is not null)
);
create index fan_stories_public on public.fan_stories (show_id, published_at desc) where status = 'approved';
create trigger fan_stories_updated_at before update on public.fan_stories for each row execute function public.set_updated_at();

-- Contact details, separate so they can never be exposed with a story.
create table public.fan_story_contacts (
  story_id uuid primary key references public.fan_stories (id) on delete cascade,
  email    text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

alter table public.fan_stories enable row level security;
alter table public.fan_story_contacts enable row level security;

create policy "Anyone can read approved fan stories" on public.fan_stories for select
  using ((status = 'approved' and published_at <= now()) or public.is_editor());
create policy "Editors review fan stories" on public.fan_stories for update to authenticated
  using (public.is_editor()) with check (public.is_editor());
create policy "Editors delete fan stories" on public.fan_stories for delete to authenticated
  using (public.is_editor());
create policy "Admins read fan story contacts" on public.fan_story_contacts for select to authenticated
  using (public.is_admin());

revoke all on public.fan_stories, public.fan_story_contacts from anon, authenticated;
grant select on public.fan_stories to anon, authenticated;
grant update, delete on public.fan_stories to authenticated;
grant select on public.fan_story_contacts to authenticated;

create or replace function public.record_fan_story(
  p_show_id uuid, p_title text, p_pen_name text, p_blurb text, p_body text, p_email text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_id   uuid;
  v_slug text;
begin
  v_slug := trim(both '-' from left(regexp_replace(lower(coalesce(p_title, '')), '[^a-z0-9]+', '-', 'g'), 60));
  v_slug := case when v_slug = '' then '' else v_slug || '-' end || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
  insert into public.fan_stories (show_id, slug, title, pen_name, blurb, body)
  values (p_show_id, v_slug, trim(p_title), trim(p_pen_name), nullif(trim(p_blurb), ''), trim(p_body))
  returning id into v_id;
  if nullif(trim(p_email), '') is not null then
    insert into public.fan_story_contacts (story_id, email) values (v_id, lower(trim(p_email)));
  end if;
  return 'ok';
exception when check_violation or foreign_key_violation then
  return 'invalid';
end $$;
revoke execute on function public.record_fan_story(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_fan_story(uuid, text, text, text, text, text) to service_role;
