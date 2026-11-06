import type { Metadata } from "next"
import Link from "next/link"
import { pageMetadata } from "@/app/data/site"
import { getActivePrompts, getShows, listFanStories } from "@/lib/realityReloaded"
import FanStoryCard from "@/app/components/fanzone/FanStoryCard"
import PromptBanner from "@/app/components/fanzone/PromptBanner"
import { GENRES } from "@/app/components/fanzone/fanFiction"
import { FanSiteNote, focusRing } from "@/app/components/fanzone/ui"

const intro = "Stories by reality TV fans, read and approved by our editors."

export const metadata: Metadata = pageMetadata("Fan fiction", intro, "/fanzone/fiction")

type Search = { show?: string; genre?: string; sort?: string }

function href(current: Search, change: Partial<Search>) {
  const next = { ...current, ...change }
  const params = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][])
  const q = params.toString()
  return `/fanzone/fiction${q ? `?${q}` : ""}`
}

function Chip({ active, href: to, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3 py-1.5 text-sm ${focusRing} ${active ? "border-accent bg-accent/20 text-contrast" : "border-contrast/15 text-contrast/80 hover:border-contrast/35"}`}
    >
      {children}
    </Link>
  )
}

export default async function FanFictionHome({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams
  const shows = ((await getShows()) ?? []).filter((s) => s.status !== "coming_soon")
  const show = shows.find((s) => s.slug === params.show)
  const genre = GENRES.some((g) => g.value === params.genre) ? params.genre : undefined
  const sort = params.sort === "loved" ? "loved" : "new"
  const filtered = Boolean(show || genre || sort === "loved")

  const [stories, picks, prompts] = await Promise.all([
    listFanStories({ showId: show?.id, genre, sort }),
    filtered ? Promise.resolve([]) : listFanStories({ featuredOnly: true, limit: 3 }),
    filtered ? Promise.resolve([]) : getActivePrompts(),
  ])

  return (
    <main className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-secondary/20 blur-[110px]" />
      <div className="relative mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 md:py-16">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="w-fit bg-gradient-to-r from-accent to-secondary bg-clip-text pb-2 font-heading text-4xl font-bold text-transparent sm:text-6xl">Fan fiction</h1>
            <p className="mt-3 max-w-prose text-lg text-contrast/85">{intro}</p>
          </div>
          <Link href="/fanzone/fiction/submit" className={`rounded-lg bg-accent px-5 py-3 font-medium text-white ${focusRing}`}>
            Write a story
          </Link>
        </header>

        <PromptBanner prompts={prompts} />

        {picks.length > 0 && (
          <section aria-labelledby="picks">
            <h2 id="picks" className="mb-5 font-heading text-2xl font-bold text-contrast">Editor&apos;s picks</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {picks.map((s) => (
                <FanStoryCard key={s.id} story={s} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="all-stories">
          <h2 id="all-stories" className="font-heading text-2xl font-bold text-contrast">
            {filtered ? "Stories" : "All stories"}
          </h2>
          <nav aria-label="Filter stories" className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Chip active={!show} href={href(params, { show: undefined })}>All shows</Chip>
              {shows.map((s) => (
                <Chip key={s.id} active={show?.id === s.id} href={href(params, { show: s.slug })}>
                  {s.short_name ?? s.name}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={!genre} href={href(params, { genre: undefined })}>All genres</Chip>
              {GENRES.map((g) => (
                <Chip key={g.value} active={genre === g.value} href={href(params, { genre: g.value })}>
                  {g.label}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={sort === "new"} href={href(params, { sort: undefined })}>Newest</Chip>
              <Chip active={sort === "loved"} href={href(params, { sort: "loved" })}>Most loved</Chip>
            </div>
          </nav>
          {stories.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((s) => (
                <FanStoryCard key={s.id} story={s} />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-contrast/75">
              No stories here yet.{" "}
              <Link href="/fanzone/fiction/submit" className={`rounded-sm underline underline-offset-4 hover:text-contrast ${focusRing}`}>
                Write the first one
              </Link>
              .
            </p>
          )}
        </section>
      </div>
      <FanSiteNote />
    </main>
  )
}
