-- =====================================================================
-- Fan accounts
-- Fans sign in with Google (and later X or Facebook). Each profile gets a
-- public fan name, taken at first from the sign-in account (X handle or
-- name) and changeable at any time. Accounts are for people aged 18+;
-- the confirmation is recorded on the profile.
-- Apply once, after 0010: SQL Editor -> paste -> Run.
-- =====================================================================

alter table public.profiles
  add column name_confirmed     boolean not null default false,
  add column adult_confirmed_at timestamptz;

-- Public fan names: 2-30 characters, letters, numbers and a few separators,
-- unique regardless of capitals. (NOT VALID: existing editor names are left as they are.)
alter table public.profiles add constraint profiles_display_name_format
  check (display_name is null or (char_length(trim(display_name)) between 2 and 30 and display_name ~ '^[A-Za-z0-9 _.''-]+$')) not valid;
create unique index profiles_display_name_unique on public.profiles (lower(display_name)) where display_name is not null;

-- New accounts: start with a fan name from the sign-in account, made unique if needed.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base      text;
  candidate text;
  tries     int := 0;
begin
  base := coalesce(
    nullif(meta->>'user_name', ''),          -- X handle
    nullif(meta->>'preferred_username', ''),
    nullif(meta->>'full_name', ''),          -- Google / Facebook name
    nullif(meta->>'name', ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );
  base := regexp_replace(coalesce(base, ''), '[^A-Za-z0-9 _.''-]', '', 'g');
  base := left(trim(regexp_replace(base, '\s+', ' ', 'g')), 24);   -- collapse gaps left by removed emoji
  if char_length(base) < 2 then base := 'Fan'; end if;
  candidate := base;
  while exists (select 1 from public.profiles where lower(display_name) = lower(candidate)) and tries < 20 loop
    tries := tries + 1;
    candidate := base || (1000 + floor(random() * 9000))::int::text;
  end loop;
  insert into public.profiles (id, display_name) values (new.id, candidate) on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Fans can change their own name and record their confirmations; never their role.
revoke update on public.profiles from authenticated;
grant update (display_name, name_confirmed, adult_confirmed_at) on public.profiles to authenticated;
