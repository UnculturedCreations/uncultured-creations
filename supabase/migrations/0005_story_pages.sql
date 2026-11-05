-- =====================================================================
-- Reality Reloaded: story pages
-- 1. Two new post types: feature (profiles, interviews, where are they now)
--    and announcement (site news, e.g. a new poll is open).
-- 2. Each post gets a readable, permanent address (slug) and an optional
--    feature image with a description for screen readers.
-- 3. A public "post-images" bucket; only editors can upload.
-- Apply once, after 0004: SQL Editor -> paste -> Run.
-- =====================================================================

alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check
  check (kind in ('news', 'gossip', 'trending', 'recap', 'scenario', 'feature', 'announcement'));

alter table public.posts
  add column image_url text check (image_url ~ '^https://'),
  add column image_alt text check (char_length(image_alt) <= 200),
  add column slug text;

-- Give existing posts an address: title words plus a short unique suffix.
update public.posts
set slug = trim(both '-' from left(regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'), 60)) || '-' || left(replace(id::text, '-', ''), 6)
where slug is null;

alter table public.posts
  alter column slug set not null,
  add constraint posts_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  add constraint posts_slug_unique unique (slug);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Editors upload post images" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images' and public.is_editor());
create policy "Editors read post image records" on storage.objects for select to authenticated
  using (bucket_id = 'post-images' and public.is_editor());
create policy "Editors replace post images" on storage.objects for update to authenticated
  using (bucket_id = 'post-images' and public.is_editor()) with check (bucket_id = 'post-images' and public.is_editor());
create policy "Editors delete post images" on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and public.is_editor());
