import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { pageMetadata } from "@/app/data/site"
import {
  getBingoCards,
  getActivePrompts,
  getCurrentSeason,
  getFanStories,
  getHousemates,
  getLatestWinner,
  getLeaderboard,
  getPredictionRounds,
  getPolls,
  getQuizzes,
  getRankings,
  getShowBySlug,
  getShowPosts,
  getShows,
  getUpcomingEvents,
} from "@/lib/realityReloaded"
import BingoCard from "@/app/components/fanzone/BingoCard"
import Countdown from "@/app/components/fanzone/Countdown"
import FanStoryCard from "@/app/components/fanzone/FanStoryCard"
import PromptBanner from "@/app/components/fanzone/PromptBanner"
import HousemateGrid from "@/app/components/fanzone/HousemateGrid"
import LeaderboardTable from "@/app/components/fanzone/LeaderboardTable"
import MyStanding from "@/app/components/fanzone/MyStanding"
import PredictionCard from "@/app/components/fanzone/PredictionCard"
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
  const meta = pageMetadata(
    show.name,
    show.tagline ?? `${show.name} news, gossip, polls and ${show.cast_singular.toLowerCase()} rankings on Reality Reloaded.`,
    `/fanzone/${show.slug}`,
  )
  // Use the show's own image for link previews when it has one.
  if (show.image_url) {
    const image = { url: show.image_url, width: 1200, height: 630, alt: show.name }
    meta.openGraph = { ...meta.openGraph, images: [image] }
    meta.twitter = { ...meta.twitter, images: [image] }
  }
  return meta
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

  const [season, posts, events, winner, polls, quizzes, bingoCards, fanStories, prompts, rounds] = await Promise.all([
    getCurrentSeason(show.id),
    getShowPosts(show.id),
    getUpcomingEvents(show.id),
    getLatestWinner(show.id),
    getPolls(show.id),
    getQuizzes(show.id),
    getBingoCards(show.id),
    getFanStories(show.id),
    getActivePrompts(show.id),
    getPredictionRounds(show.id),
  ])
  const [housemates, rankings, leaderboard] = await Promise.all([
    season ? getHousemates(season.id) : Promise.resolve([]),
    season ? getRankings(season.id) : Promise.resolve([]),
    getLeaderboard(show.id, season?.id ?? null, 10),
  ])
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
        <header className={show.image_url ? "grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,28rem)]" : undefined}>
          {show.image_url && (
            // Show images are resized to 1200 x 630 when uploaded.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={show.image_url} alt="" width={1200} height={630} className="aspect-[1200/630] w-full rounded-2xl object-cover lg:order-last" />
          )}
          <div>
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
          </div>
        </header>

        {!season && (
          <section aria-labelledby="between-seasons" className="rounded-3xl border border-contrast/10 bg-contrast/[0.03] p-8">
            <h2 id="between-seasons" className="font-heading text-2xl font-bold text-contrast">
              Between seasons
            </h2>
            <p className="mt-3 max-w-prose text-contrast/80">
              The {show.venue} is quiet for now. {show.cast_singular} rankings, polls and predictions return when the next season starts.
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

        {rounds.length > 0 && (
          <section aria-labelledby="predictions">
            <SectionHeading id="predictions" title="Predictions" intro="Call it before the live show. Correct predictions earn points on the season leaderboard." />
            <div className="grid gap-5 md:grid-cols-2">
              {rounds.map((round) => (
                <div key={round.id} className={round.options.length > 8 ? "md:col-span-2" : undefined}>
                  <PredictionCard round={round} />
                </div>
              ))}
            </div>
          </section>
        )}

        {(rounds.length > 0 || leaderboard.length > 0) && (
          <section aria-labelledby="leaderboard">
            <SectionHeading id="leaderboard" title="Leaderboard" intro={season ? `Top predictors for ${season.name}.` : "Top predictors this season."} />
            <MyStanding showId={show.id} seasonId={season?.id ?? null} />
            {leaderboard.length > 0 ? (
              <LeaderboardTable rows={leaderboard} caption={`Top predictors for ${show.name}`} />
            ) : (
              <p className="text-contrast/75">The leaderboard fills up after the first prediction round is decided.</p>
            )}
            <Link href={`/fanzone/${show.slug}/leaderboard`} className={`mt-4 inline-flex rounded-sm text-sm text-contrast/75 underline underline-offset-4 hover:text-contrast ${focusRing}`}>
              Full leaderboard
            </Link>
          </section>
        )}

        {polls.length > 0 && (
          <section aria-labelledby="polls">
            <SectionHeading id="polls" title="Fan polls" intro="One vote per device. Results are fan opinion, just for fun." />
            <div className="grid gap-5 md:grid-cols-2">
              {polls.map((poll) => (
                <div key={poll.id} className={poll.options.length > 8 ? "md:col-span-2" : undefined}>
                  <PollCard poll={poll} />
                </div>
              ))}
            </div>
          </section>
        )}

        {bingoCards.length > 0 && (
          <section aria-labelledby="bingo">
            <SectionHeading id="bingo" title="Bingo" intro="Play along live. Your card is shuffled just for you." />
            <div className="grid gap-5 lg:grid-cols-2">
              {bingoCards.map((card) => (
                <BingoCard key={card.id} card={card} showName={show.name} showSlug={show.slug} />
              ))}
            </div>
          </section>
        )}

        {rankings.length > 0 && (
          <section aria-labelledby="rankings">
            <SectionHeading id="rankings" title={`${show.cast_singular} rankings`} intro="Running totals for the season so far." />
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

        <section aria-labelledby="fan-fiction">
          <SectionHeading id="fan-fiction" title="Fan fiction" intro={`Stories by ${label} fans, read and approved by our editors.`} />
          <div className="mb-5">
            <PromptBanner prompts={prompts} />
          </div>
          {fanStories.length > 0 && (
            <div className="mb-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {fanStories.map((story) => (
                <FanStoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
          <Link
            href={`/fanzone/fiction/submit?show=${show.slug}`}
            className={`inline-flex rounded-lg border border-contrast/20 px-5 py-2.5 text-sm font-medium text-contrast hover:border-contrast/40 ${focusRing}`}
          >
            {fanStories.length > 0 ? "Write your own story" : "Be the first to write one"}
          </Link>
          <Link href={`/fanzone/fiction?show=${show.slug}`} className={`ml-4 rounded-sm text-sm text-contrast/75 underline underline-offset-4 hover:text-contrast ${focusRing}`}>
            All {label} fan fiction
          </Link>
        </section>

        {housemates.length > 0 && (
          <section aria-labelledby="housemates">
            <SectionHeading id="housemates" title={show.cast_plural} />
            <HousemateGrid housemates={housemates} venue={show.venue} />
          </section>
        )}

        <YardCta showName={label} />
      </div>
      <FanSiteNote />
    </main>
  )
}
