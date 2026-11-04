# Supabase: Reality Reloaded database

The hub's interactive content (shows, housemates, posts, rankings, polls and
quizzes) lives in Supabase. Project: `uncultured-creations` (region eu-west-1).

## Files

| File | What it does | When to run |
| --- | --- | --- |
| `migrations/0001_reality_reloaded_foundations.sql` | Creates the tables, security rules and editor roles | Once, first |
| `seed/0001_shows_and_sample_data.sql` | Adds the three shows plus fictional sample content | Once, after the migration |
| `seed/0002_remove_sample_data.sql` | Deletes all sample content (the shows stay) | Before real content goes in |

To run a file: Supabase dashboard -> **SQL Editor** -> **New query** -> paste the
file's contents -> **Run**. Migrations are numbered; run them in order, once each.

## Security model

- Visitors can read published content only: drafts, draft polls and unpublished
  quizzes are hidden.
- Only editors (`profiles.role` = `editor` or `admin`) can create or change content.
- Individual poll votes can't be read or written by anyone through the website;
  only vote totals are available, via `poll_results()`. Voting itself arrives with
  a protected, bot-checked function in a later step.
- Users can change their display name but never their role.

## Making someone an editor

1. They sign in once (sign-in arrives with the editor area).
2. Dashboard -> **Table Editor** -> `profiles` -> set their `role` to `editor`.

## Keys

The website uses the **Project URL** and the **publishable key**, both public by
design. The **secret** (`service_role`) key bypasses every security rule: never
put it in this repository, in Vercel, or anywhere in the website's code.
