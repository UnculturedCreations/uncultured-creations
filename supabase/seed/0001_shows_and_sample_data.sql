-- =====================================================================
-- Reality Reloaded: starting data
-- 1. The shows (real rows; update their status as seasons start and end).
-- 2. SAMPLE content (is_sample = true) so pages can be built and tested.
--    Every sample row is fictional. Remove it all with
--    supabase/seed/0002_remove_sample_data.sql before real content goes in.
-- Apply after the 0001 migration: SQL Editor -> paste -> Run.
-- =====================================================================

insert into public.shows (slug, name, short_name, country, status, tagline, accent_color, sort_order) values
  ('big-brother-naija',  'Big Brother Naija',  'BBNaija',  'Nigeria',       'off_season',  'The house, the drama, the votes.',          '#0066FF', 1),
  ('big-brother-mzansi', 'Big Brother Mzansi', 'BBMzansi', 'South Africa',  'off_season',  'Mzansi''s house of twists and loyalties.',   '#A855F7', 2),
  ('love-island-usa',    'Love Island USA',    'LIUSA',    'United States', 'coming_soon', 'Villa romance, recouplings and chaos.',      '#F0EBE1', 3);

do $$
declare
  s_id uuid; season uuid; poll uuid; quiz uuid; q uuid;
  cat_tasks uuid; cat_noms uuid; cat_survived uuid;
  h uuid[];
  names text[] := array['Sample Housemate A','Sample Housemate B','Sample Housemate C',
                        'Sample Housemate D','Sample Housemate E','Sample Housemate F'];
  colors text[] := array['#0066FF','#A855F7','#F0EBE1','#3D85FF','#C084FC','#9CA3AF'];
  i int;
begin
  select id into s_id from public.shows where slug = 'big-brother-naija';

  insert into public.seasons (show_id, name, is_current, is_sample)
  values (s_id, 'Sample Season', true, true) returning id into season;

  for i in 1..6 loop
    insert into public.housemates (season_id, name, color, status, exit_week, sort_order, is_sample)
    values (season, names[i], colors[i],
            case when i = 6 then 'evicted' else 'in_house' end,
            case when i = 6 then 2 end, i, true)
    returning id into q;
    h := array_append(h, q);
  end loop;

  insert into public.ranking_categories (season_id, name, sort_order, is_sample) values
    (season, 'Most tasks won', 1, true) returning id into cat_tasks;
  insert into public.ranking_categories (season_id, name, sort_order, is_sample) values
    (season, 'Most nominations received', 2, true) returning id into cat_noms;
  insert into public.ranking_categories (season_id, name, sort_order, is_sample) values
    (season, 'Most evictions survived', 3, true) returning id into cat_survived;

  for i in 1..6 loop
    insert into public.housemate_stats (category_id, housemate_id, value) values
      (cat_tasks,    h[i], (7 - i)),
      (cat_noms,     h[i], (i % 4)),
      (cat_survived, h[i], greatest(0, 4 - i));
  end loop;

  insert into public.show_events (show_id, title, kind, starts_at, is_sample) values
    (s_id, 'Sample live eviction show', 'eviction', now() + interval '3 days', true);

  insert into public.posts (show_id, kind, title, summary, status, published_at, is_sample) values
    (null, 'trending', 'Sample trending topic across reality TV',
     'A sample general post for the Reality Reloaded home page.', 'published', now() - interval '2 hours', true),
    (s_id, 'gossip', 'Sample gossip: a new alliance forms',
     'Sample gossip summary written in our own words.', 'published', now() - interval '5 hours', true),
    (s_id, 'recap', 'Sample recap: week two in sixty seconds',
     'Sample recap summary.', 'published', now() - interval '1 day', true),
    (s_id, 'scenario', 'Sample scenario: how eviction night could play out',
     'Sample scenario summary.', 'published', now() - interval '1 day', true),
    (s_id, 'news', 'Sample draft that visitors must not see',
     'Drafts are visible to editors only.', 'draft', null, true);

  insert into public.polls (show_id, season_id, question, status, show_results, is_sample)
  values (s_id, season, 'Sample poll: who is the hottest housemate this week?', 'open', 'after_vote', true)
  returning id into poll;
  for i in 1..5 loop
    insert into public.poll_options (poll_id, label, housemate_id, sort_order) values (poll, names[i], h[i], i);
  end loop;

  insert into public.polls (show_id, season_id, question, status, is_sample)
  values (s_id, season, 'Sample draft poll that visitors must not see', 'draft', true);

  insert into public.quizzes (show_id, title, description, status, published_at, is_sample)
  values (s_id, 'Sample quiz: how well do you know the house?', 'Three sample questions.', 'published', now(), true)
  returning id into quiz;
  for i in 1..3 loop
    insert into public.quiz_questions (quiz_id, prompt, explanation, sort_order)
    values (quiz, 'Sample question ' || i, 'Sample explanation ' || i, i) returning id into q;
    insert into public.quiz_options (question_id, label, is_correct, sort_order) values
      (q, 'Sample right answer', true, 1), (q, 'Sample wrong answer', false, 2), (q, 'Another wrong answer', false, 3);
  end loop;
end $$;
