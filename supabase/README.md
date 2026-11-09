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
| `migrations/0005_story_pages.sql` | Feature and Announcement types, story addresses (slugs), feature images with descriptions, `post-images` bucket | Once, after 0004 |
| `migrations/0006_yard_signups.sql` | Yard early-access sign-ups table; only admins can read or delete | Once, after 0005 |
| `migrations/0007_show_images.sql` | Optional image per show (stored in `post-images`, folder `shows/`) | Once, after 0006 |
| `migrations/0008_bingo.sql` | Bingo cards per show (4 x 4 or 5 x 5, a list of moments); played and shared entirely in the browser | Once, after 0007 |
| `migrations/0009_fan_fiction.sql` | Fan fiction submissions and approvals; submitter emails kept separately, admins only | Once, after 0008 |
| `migrations/0010_fan_fiction_plus.sql` | Covers, genres, content notes, word counts, reactions, editor's picks, weekly writing prompts; `fan-covers` bucket | Once, after 0009 |
| `migrations/0011_fan_accounts.sql` | Fan accounts: public fan names (unique), first-sign-in confirmation, 18+ record | Once, after 0010 |
| `migrations/0012_predictions.sql` | Prediction rounds, fans' picks (locked at a set time), results and season leaderboards | Once, after 0011 |
| `migrations/0013_story_comments.sql` | Comments on fan fiction: reports (3 hide a comment), spam limits, editor moderation, turning off commenting per fan | Once, after 0012 |
| `functions/delete-account/index.ts` | Edge Function that lets a signed-in fan delete their own account | Deploy once (Verify JWT off) |
| `functions/react/index.ts` | Edge Function that checks Turnstile, then records a reader's reaction to a story | Deploy once, like cast-vote |
| `functions/submit-story/index.ts` | Edge Function that checks Turnstile, then stores a fan fiction submission for review | Deploy once, like cast-vote |
| `functions/join-yard/index.ts` | Edge Function that checks Turnstile, then records a Yard sign-up | Deploy once, like cast-vote |
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

## Yard early-access sign-ups

Deploy `functions/join-yard/index.ts` exactly like `cast-vote`: name it `join-yard`,
turn **off** "Verify JWT". It uses the same `TURNSTILE_SECRET_KEY` and
`TURNSTILE_ALLOWED_HOSTNAMES` secrets, so no new secrets are needed.

The sign-up form stays switched off until `NEXT_PUBLIC_CONTACT_EMAIL` is set in Vercel
(it is the address the privacy notice gives for data requests). Sign-ups appear in the
editor's **Yard sign-ups** tab, for **admins only**; export them to a spreadsheet there,
and delete anyone who asks.

## Fan fiction

Deploy `functions/submit-story/index.ts` like the other functions: name it `submit-story`,
turn **off** "Verify JWT". No new secrets. Submissions stay switched off until
`NEXT_PUBLIC_CONTACT_EMAIL` is set, because the privacy notice and the "Report this story"
link use it.

Every submission waits in the editor's **Fan fiction** tab until an editor approves it.
Writers' emails (optional) are visible to admins only.

Since 0010, `submit-story` also accepts genres, content notes, a writing prompt and an
optional cover (a small JPEG resized in the browser, checked and stored in `fan-covers`):
**redeploy it** with the updated code. Reactions use a separate `react` function, deployed
the same way (Verify JWT off). Writing prompts and editor's picks are managed in the editor.

## Fan accounts

Fans sign in at `/account` with Google (X and Facebook can be switched on later in
**Authentication > Sign In / Providers**; the buttons appear automatically). The first
sign-in asks them to confirm their public fan name and that they're 18 or older.
Fans can rename themselves, sign out, and delete their account (via `delete-account`).
Editor and admin accounts can't be deleted from `/account`.

Setup: enable the Google provider, add the site and preview addresses under
**Authentication > URL Configuration**, and turn **Allow new users to sign up** on.

## Predictions

Editors create rounds in the **Predictions** tab (question, points, lock time, options).
Signed-in fans who finished the welcome step pick one answer, changeable until the lock.
After the show, **Mark result** (tick several for a double eviction); **Correct result**
fixes mistakes and the leaderboard recalculates. Leaderboards count resolved rounds in the
show's current season.

## Comments

Signed-in fans comment on approved fan fiction; comments appear straight away. Fans can
delete their own comments and report others'. A comment reported by three different fans
is hidden until an editor reviews it in the **Comments** tab (Restore, Delete, or turn off
commenting for that fan). Limits: 1,000 characters, 5 comments a minute, no repeats.

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
