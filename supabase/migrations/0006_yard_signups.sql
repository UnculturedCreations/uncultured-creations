-- =====================================================================
-- The Yard: early-access sign-ups
-- Personal data (email addresses), so access is deliberately narrow:
-- * nobody can write directly; sign-ups arrive only through the
--   join-yard Edge Function after a Cloudflare Turnstile check;
-- * only admins (not editors) can read or delete them.
-- Apply once, after 0005: SQL Editor -> paste -> Run.
-- =====================================================================

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;
grant execute on function public.is_admin() to anon, authenticated;

create table public.yard_signups (
  id            uuid primary key default gen_random_uuid(),
  email         text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name          text check (char_length(name) <= 80),
  role          text not null check (role in ('landlord', 'resident')),
  fanbase_name  text check (char_length(fanbase_name) <= 80),
  show_id       uuid references public.shows (id) on delete set null,
  fanbase_size  text check (fanbase_size in ('under_100', '100_1000', '1000_10000', 'over_10000')),
  current_tools text check (char_length(current_tools) <= 300),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
-- One sign-up per email address (case-insensitive).
create unique index yard_signups_email_unique on public.yard_signups (lower(email));
create trigger yard_signups_updated_at before update on public.yard_signups for each row execute function public.set_updated_at();

alter table public.yard_signups enable row level security;
create policy "Admins read sign-ups" on public.yard_signups for select to authenticated using (public.is_admin());
create policy "Admins delete sign-ups" on public.yard_signups for delete to authenticated using (public.is_admin());
revoke all on public.yard_signups from anon, authenticated;
grant select, delete on public.yard_signups to authenticated;

create or replace function public.record_yard_signup(
  p_email text, p_name text, p_role text, p_fanbase_name text, p_show_id uuid, p_fanbase_size text, p_current_tools text
) returns text
language plpgsql security definer set search_path = public as $$
begin
  insert into public.yard_signups (email, name, role, fanbase_name, show_id, fanbase_size, current_tools)
  values (lower(trim(p_email)), nullif(trim(p_name), ''), p_role, nullif(trim(p_fanbase_name), ''), p_show_id,
          nullif(p_fanbase_size, ''), nullif(trim(p_current_tools), ''))
  -- Signing up again updates the role, and keeps earlier answers unless new ones are given.
  on conflict ((lower(email))) do update set
    role          = excluded.role,
    name          = coalesce(excluded.name, yard_signups.name),
    fanbase_name  = coalesce(excluded.fanbase_name, yard_signups.fanbase_name),
    show_id       = coalesce(excluded.show_id, yard_signups.show_id),
    fanbase_size  = coalesce(excluded.fanbase_size, yard_signups.fanbase_size),
    current_tools = coalesce(excluded.current_tools, yard_signups.current_tools);
  return 'ok';
exception when check_violation then
  return 'invalid';
end $$;
revoke execute on function public.record_yard_signup(text, text, text, text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_yard_signup(text, text, text, text, uuid, text, text) to service_role;
