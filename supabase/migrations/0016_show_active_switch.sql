-- =====================================================================
-- Show active switch
-- Inactive shows disappear from the public site (no card, no show page,
-- not in the sitemap, their news left out of Top stories). Nothing is
-- deleted; switching a show back on restores everything.
-- Apply once, after 0015: SQL Editor -> paste -> Run.
-- =====================================================================

alter table public.shows add column is_active boolean not null default true;
