# Uncultured Creations

A hub of bold storytelling, unapologetic fandom, and raw creativity.

Live site: https://uncultured-creations.vercel.app

## Sections

| Section | Route | Status |
| --- | --- | --- |
| Landing page | `/` | Live: animated hero and section carousel |
| Reality Reloaded (fan zone) | `/fanzone`, `/fanzone/[show]` | Live: top stories, show pages, rankings, polls and quizzes (data from Supabase) |
| Stories | `/stories` | Coming soon |
| Lyrics & Spoken Word | `/music` | Coming soon |
| Portfolio | `/portfolio` | Coming soon (previous portfolio preserved, see below) |
| The Lab | `/the-lab` | Coming soon |

Editors manage Reality Reloaded content at `/editor` (see `supabase/README.md` for creating accounts).

Planned: fanbase vote tracking and leaderboards, as part of Reality Reloaded.

## Tech stack

- [Next.js](https://nextjs.org) 15 (App Router) with React 19 and TypeScript
- Tailwind CSS 3 for styling, Framer Motion for animation, lucide-react for icons
- Fonts: Inter and Space Grotesk via `next/font`
- Hosted on Vercel; deploys automatically from `main`
- Reality Reloaded content stored in Supabase (Postgres)

## Getting started

Requires Node.js 18.18 or later (20 LTS recommended).

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build (run before opening a pull request)
npm run start    # serve the production build locally
npm run lint     # ESLint
```

## Project structure

```
src/app/
├── (hub)/                 Pages that share the site header and footer
│   ├── layout.tsx         Header, footer, dark background, skip link
│   ├── page.tsx           Landing page
│   ├── fanzone/ stories/ music/ portfolio/ the-lab/
│   └── about/ contact/ news/    Not built yet; return 404
├── components/common/     Header, Footer, ComingSoon
├── data/
│   ├── navigation.ts      The five sections: used by header, footer, 404 page and sitemap
│   └── site.ts            Site URL, name, description and page-metadata helper
├── layout.tsx             Root layout: fonts and site-wide metadata
├── not-found.tsx          Branded 404 page
├── robots.ts, sitemap.ts  Search-engine files
├── favicon.ico, icon.png, apple-icon.png, opengraph-image.jpg, twitter-image.jpg
└── thank-you/             Confirmation page for the preserved portfolio contact form
public/images/             Images used by the site
design/brand-assets/       Logo candidates and source artwork (not served)
```

Route groups such as `(hub)` organise files without changing URLs.

## Common changes

**Launch a section.** Replace the `<ComingSoon />` component in the section's `page.tsx` with real content. Keep the `pageMetadata(...)` export so the page keeps its title, description and link preview.

**Add a section to the navigation.** Add it to `src/app/data/navigation.ts`. The header, footer, 404 page and sitemap update automatically.

**Restore the previous portfolio.** It is preserved, unserved, in `src/app/(hub)/portfolio/PortfolioHome.tsx`; the note at the top of that file explains how to restore it.

**Replace the logo.** Update `public/images/landing/logo-temp.png`, then regenerate the favicon, app icons and link-preview image in `src/app/`.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes, for Reality Reloaded | The Supabase project address. Public. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes, for Reality Reloaded | Supabase's publishable key. Public by design; access is enforced by database security rules. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | For poll voting | Cloudflare Turnstile site key (public). Without it, polls show but voting is off. The secret key lives only in Supabase. |
| `NEXT_PUBLIC_SHOW_SAMPLE_DATA` | No | `true` shows fictional sample content (rows with `is_sample`). Set it for local development and Vercel Preview only; leave it unset in Production. |
| `NEXT_PUBLIC_SITE_URL` | No | Public site address for canonical links, the sitemap and link previews. Defaults to `https://uncultured-creations.vercel.app`; set it in Vercel when a custom domain is connected. |

Copy `.env.example` to `.env.local` for local development. There are no secrets: never add Supabase's secret (`service_role`) key to this project. See `supabase/README.md` for the database.

## Accessibility and motion

Decorative animation is disabled when the visitor's device requests reduced motion, and the landing carousel never auto-rotates in that case. Keep this behaviour for new animations: use Framer Motion's `useReducedMotion()` or Tailwind's `motion-reduce:` variants.

## Brand

Colours are defined in `tailwind.config.ts`: `accent` (#0066FF), `secondary` (#A855F7), `base` (#121212) and `contrast` (#F0EBE1). Headings use Space Grotesk (`font-heading`); body text uses Inter.
