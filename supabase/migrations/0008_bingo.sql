-- =====================================================================
-- Reality Reloaded: eviction-night bingo
-- Editors publish bingo cards per show: a title, a size and a list of
-- moments. Each fan's browser shuffles its own card from the list and
-- keeps their ticks locally, so playing needs no accounts or writes.
-- Apply once, after 0007: SQL Editor -> paste -> Run.
-- =====================================================================

-- Every moment must be 1-60 characters (checked per item).
create or replace function public.bingo_items_valid(items text[])
returns boolean language sql immutable as $$
  select coalesce(bool_and(char_length(trim(i)) between 1 and 60), false) from unnest(items) as i
$$;

create table public.bingo_cards (
  id           uuid primary key default gen_random_uuid(),
  show_id      uuid not null references public.shows (id) on delete cascade,
  title        text not null check (char_length(title) <= 80),
  description  text check (char_length(description) <= 200),
  size         int not null default 4 check (size in (4, 5)),
  items        text[] not null check (public.bingo_items_valid(items)),
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by   uuid references public.profiles (id) on delete set null,
  is_sample    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Enough moments to fill the card (5 x 5 has a free centre square), and not too many.
  check (cardinality(items) between (case when size = 5 then 24 else 16 end) and 80),
  check (status = 'draft' or published_at is not null)
);
create trigger bingo_cards_updated_at before update on public.bingo_cards for each row execute function public.set_updated_at();

alter table public.bingo_cards enable row level security;
create policy "Anyone can read published bingo cards" on public.bingo_cards for select
  using ((status = 'published' and published_at <= now()) or public.is_editor());
create policy "Editors manage bingo cards" on public.bingo_cards for all to authenticated
  using (public.is_editor()) with check (public.is_editor());
grant select on public.bingo_cards to anon, authenticated;
grant insert, update, delete on public.bingo_cards to authenticated;
