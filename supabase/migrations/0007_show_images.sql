-- =====================================================================
-- Reality Reloaded: show images
-- An optional image per show (1200 x 630), shown on show cards, the show
-- page and its link preview. Stored in the existing editor-only
-- "post-images" bucket (folder shows/), so no new storage setup is needed.
-- Apply once, after 0006: SQL Editor -> paste -> Run.
-- =====================================================================

alter table public.shows
  add column image_url text check (image_url ~ '^https://');
