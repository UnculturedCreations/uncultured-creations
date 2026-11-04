import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { pageMetadata } from "@/app/data/site"
import {
  getCurrentSeason,
  getHousemates,
  getLatestWinner,
  getPolls,
  getQuizzes,
  getRankings,
  getShowBySlug,
  getShowPosts,
  getShows,
  getUpcomingEvents,
} from "@/lib/realityReloaded"
import Countdown from "@/app/components/fanzone/Countdown"
import HousemateGrid from "@/app/components/fanzone/HousemateGrid"
import PollCard from "@/app/components/fanzone/PollCard"
import QuizCard from "@/app/components/fanzone/QuizCard"
import RankingsBoard from "@/app/components/fanzone/RankingsBoard"
import StoryCard from "@/app/components/fanzone/StoryCard"
import YardCta from "@/app/components/fanzone/YardCta"
import { FanSiteNote, SectionHeading, StatusPill, focusRing } from "@/app/components/fanzone/ui"

export const revalidate = 60

type Params = { params: Promise<{ show: string }> }

// Pre-build pages for known shows; new shows still work (rendered on first visit).
export async function generateStaticParams() {
  const shows = await getShows()
  return (shows ?? []).filter((s) => s.status !== "coming_soon").map((s) => ({ show: s.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { show: slug } = await params
  const { show, available } = await getShowBySlug(slug)
  if (!available) return { title: "Reality Reloaded | Uncultured Creations" }
  if (!show || show.status === "coming_soon") return { title: "Page not found | Uncultured Creations" }
  return pageMetadata(
    show.name,
    show.tagline ?? `${show.name} news, gossip, polls and housemate rankings on Reality Reloaded.`,
    `/fanzone/${show.slug}`,
  )
}

export default async function ShowPage({ params }: Params) {
  const { show: slug } = await params
  const { show, available } = await getShowBySlug(slug)

  if (!available) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p role="status" className="rounded-2xl border border-contrast/15 p-5 text-contrast/80">
          This page is unavailable right now. Please check back in a few minutes.
        </p>
      </main>
    )
  }
  if (!show || show.status === "coming_soon") notFound()

  const [season, posts, events, winner, polls, quizzes] = await Promise.all([
    getCurrentSeason(show.id),
    getShowPosts(show.id),
    getUpcomingEvents(show.id),
    getLatestWinner(show.id),
    getPolls(show.id),
    getQuizzes(show.id),
  ])
  const [housemates, rankings] = season
    ? await Promise.all([getHousemates(season.id), getRankings(season.id)])
    : [[], []]
  const nextEvent = events[0]
  const label = show.short_name ?? show.name

  return (
    <main className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full opacity-25 blur-[110px]"
        style={{ backgroundColor: show.accent_color ?? "#0066FF" }}
      />

      <div className="relative mx-auto max-w-6xl space-y-16 px-4 py-10 sm:px-6 md:py-14">
        <header>
          <Link
            href="/fanzone"
            className={`inline-flex items-center gap-1.5 rounded-sm text-sm text-contrast/70 hover:text-contrast ${focusRing}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Reality Reloaded
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <StatusPill status={show.status} />
            {show.country && <span className="text-sm text-contrast/60">{show.country}</span>}
            {season && <span className="text-sm text-contrast/60">{season.name}</span>}
          </div>
          <h1 className="mt-4 font-heading text-4xl font-bold text-contrast sm:text-6xl">{show.name}</h1>
          {show.tagline && <p className="mt-4 max-w-prose text-lg text-contrast/85">{show.tagline}</p>}
          {nextEvent && (
            <p className="mt-6 inline-flex flex-wrap items-baseline gap-x-2 rounded-2xl border border-contrast/10 bg-contrast/[0.03] px-4 py-3">
              <span className="font-medium text-contrast">{nextEvent.title}:</span>
              <Countdown startsAt={nextEvent.starts_at} />
            </p>
          )}
        </header>

        {!season && (
          <section aria-labelledby="between-seasons" className="rounded-3xl border border-contrast/10 bg-contrast/[0.03] p-8">
            <h2 id="between-seasons" className="font-heading text-2xl font-bold text-contrast">
              Between seasons
            </h2>
            <p className="mt-3 max-w-prose text-contrast/80">
              The house is quiet for now. Housemate rankings, polls and predictions return when the next season starts.
            </p>
            {winner?.winner_name && (
              <p className="mt-5 text-contrast/80">
                Last winner: <span className="font-bold text-contrast">{winner.winner_name}</span>
                <span className="text-contrast/60"> ({winner.name})</span>
              </p>
            )}
          </section>
        )}

        <section aria-labelledby="this-week">
          <SectionHeading id="this-week" title={season ? "This week" : "Latest"} intro={`Recaps, gossip and what could happen next in ${label}.`} />
          {posts.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <StoryCard key={post.id} post={post} showShowTag={false} />
              ))}
            </div>
          ) : (
            <p className="text-contrast/70">Nothing posted yet. Check back soon.</p>
          )}
        </section>

        {polls.length > 0 && (
          <section aria-labelledby="polls">
            <SectionHeading id="polls" title="Fan polls" intro="One vote per device. Results are fan opinion, just for fun." />
            <div className="grid gap-5 md:grid-cols-2">
              {polls.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          </section>
        )}

        {rankings.length > 0 && (
          <section aria-labelledby="rankings">
            <SectionHeading id="rankings" title="Housemate rankings" intro="Running totals for the season so far." />
            <RankingsBoard categories={rankings} />
          </section>
        )}

        {quizzes.length > 0 && (
          <section aria-labelledby="quizzes">
            <SectionHeading id="quizzes" title="Quizzes" intro={`How well do you know ${label}?`} />
            <div className="grid gap-5 md:grid-cols-2">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          </section>
        )}

        {housemates.length > 0 && (
          <section aria-labelledby="housemates">
            <SectionHeading id="housemates" title="Housemates" />
            <HousemateGrid housemates={housemates} />
          </section>
        )}

        <YardCta showName={label} />
      </div>
      <FanSiteNote />
    </main>
  )
}
