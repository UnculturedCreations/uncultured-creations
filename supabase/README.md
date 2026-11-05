# Supabase: Reality Reloaded database

The hub's interactive content (shows, housemates, posts, rankings, polls and
quizzes) lives in Supabase. Project: `uncultured-creations` (region eu-west-1).

## Files

| File | What it does | When to run |
| --- | --- | --- |
| `migrations/0001_reality_reloaded_foundations.sql` | Creates the tables, security rules and editor roles | Once, first |
| `seed/0001_shows_and_sample_data.sql` | Adds the three shows plus fictional sample content | Once, after the migration |
| `seed/0002_remove_sample_data.sql` | Deletes all sample content (the shows stay) | Before real content goes in |
| `migrations/0002_poll_voting.sql` | Adds `record_vote()`, callable only with the secret key | Once, after 0001 |
| `migrations/0003_show_wording_poll_closing_images.sql` | Per-show wording (housemates/islanders, house/villa), automatic poll closing, image field, adds Love Island Nigeria | Once, after 0002 |
| `migrations/0004_housemate_image_storage.sql` | Creates the public `housemates` image bucket; only editors can upload | Once, after 0003 |
| `functions/cast-vote/index.ts` | Edge Function that checks Turnstile, then records a vote | Deploy once; redeploy after changes |

To run a file: Supabase dashboard -> **SQL Editor** -> **New query** -> paste the
file's contents -> **Run**. Migrations are numbered; run them in order, once each.

## Poll voting

Votes go: browser -> `cast-vote` Edge Function -> Cloudflare Turnstile check ->
`record_vote()` -> `poll_votes`. The browser cannot call `record_vote()` itself.

Deploying the function (dashboard):
1. **Edge Functions** -> **Deploy a new function** -> **Via Editor**, name it `cast-vote`.
2. Paste `functions/cast-vote/index.ts` and deploy.
3. In the function's settings, turn **off** "Verify JWT" (visitors are anonymous;
   Turnstile protects the function).
4. **Edge Functions** -> **Secrets**: add `TURNSTILE_SECRET_KEY` (from Cloudflare) and
   `TURNSTILE_ALLOWED_HOSTNAMES`, e.g.
   `uncultured-creations.vercel.app,uncultured-creations-*.vercel.app`
   (add a custom domain here when one is connected).

Never set `TURNSTILE_VERIFY_URL`; it exists only for local testing.

## Housemate images

Editors upload images per housemate in **Seasons and rankings**. Images are cropped
to a 320 x 320 square and compressed in the browser before upload, so each is
roughly 20-40 KB. Without an image (or if one fails to load), coloured initials are
shown. Only upload images you have the right to use; stylised illustrations are
safer than photos or photorealistic AI images of real people.

## Security model

- Visitors can read published content only: drafts, draft polls and unpublished
  quizzes are hidden.
- Only editors (`profiles.role` = `editor` or `admin`) can create or change content.
- Individual poll votes can't be read or written by anyone through the website;
  only vote totals are available, via `poll_results()`. Voting itself arrives with
  a protected, bot-checked function in a later step.
- Users can change their display name but never their role.

## The editor area (/editor)

Editors sign in at `/editor` with an email and password to post stories, run polls
and quizzes, manage seasons, housemates and weekly rankings, and update show status
and the schedule. There is no public sign-up.

**Create an editor account:**
1. Dashboard -> **Authentication** -> **Users** -> **Add user** -> **Create new user**.
   Enter their email and a password, and tick **Auto Confirm User**.
2. **Table Editor** -> `profiles` -> find the new row -> set `role` to `editor`
   (or `admin`). Without this they can sign in but see "No editor access yet".
3. Share the password with them privately. To reset it later, edit the user in
   **Authentication** -> **Users** (password-reset emails need custom SMTP).

**Recommended:** **Authentication** -> **Sign In / Providers** -> turn off
**Allow new users to sign up**, so only accounts you create can exist.

To remove someone's access, set their `role` back to `fan` or delete the user.

## Keys

The website uses the **Project URL** and the **publishable key**, both public by
design. The **secret** (`service_role`) key bypasses every security rule: never
put it in this repository, in Vercel, or anywhere in the website's code.
