-- =====================================================================
-- Reality Reloaded: show wording, automatic poll closing, housemate images
-- 1. Each show sets its own words (Housemates in the house, Islanders in the villa).
-- 2. Polls with a closing time reveal "after close" results automatically.
-- 3. Housemates can have an image (uploaded by editors; see 0004).
-- 4. Adds Love Island Nigeria.
-- Apply once, after 0002: SQL Editor -> paste -> Run.
-- =====================================================================

alter table public.shows
  add column cast_singular text not null default 'Housemate' check (char_length(cast_singular) between 1 and 20),
  add column cast_plural   text not null default 'Housemates' check (char_length(cast_plural) between 1 and 20),
  add column venue         text not null default 'house' check (venue in ('house', 'villa'));

alter table public.housemates
  add column image_url text check (image_url ~ '^https://');

-- A poll counts as closed once its closing time passes, even if nobody closes it by hand.
create or replace function public.poll_results(p_poll_id uuid)
returns table (option_id uuid, votes bigint)
language sql stable security definer set search_path = public as $$
  select o.id, count(v.id)
  from public.poll_options o
  join public.polls p on p.id = o.poll_id
  left join public.poll_votes v on v.option_id = o.id
  where o.poll_id = p_poll_id
    and (p.status in ('open', 'closed') or public.is_editor())
    and (
      p.show_results <> 'after_close'
      or p.status = 'closed'
      or (p.closes_at is not null and p.closes_at <= now())
      or public.is_editor()
    )
  group by o.id
$$;

-- Love Island uses islanders and a villa.
update public.shows set cast_singular = 'Islander', cast_plural = 'Islanders', venue = 'villa'
where slug = 'love-island-usa';

insert into public.shows (slug, name, short_name, country, status, tagline, accent_color, sort_order, cast_singular, cast_plural, venue)
values ('love-island-nigeria', 'Love Island Nigeria', 'LI Nigeria', 'Nigeria', 'upcoming',
        'Couples, recouplings and villa drama.', '#EC4899', 0, 'Islander', 'Islanders', 'villa')
on conflict (slug) do nothing;
