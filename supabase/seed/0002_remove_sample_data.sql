-- Removes every sample row added by 0001_shows_and_sample_data.sql.
-- The three shows stay. Related rows (housemates, stats, options, votes,
-- questions) are removed automatically with their parents.
delete from public.polls       where is_sample;
delete from public.quizzes     where is_sample;
delete from public.posts       where is_sample;
delete from public.show_events where is_sample;
delete from public.seasons     where is_sample;
