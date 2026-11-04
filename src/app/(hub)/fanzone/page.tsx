import type { Metadata } from "next"
import { pageMetadata } from "@/app/data/site"
import { getShows, getTopStories, getUpcomingEvents } from "@/lib/realityReloaded"
import ShowCard from "@/app/components/fanzone/ShowCard"
import StoryCard from "@/app/components/fanzone/StoryCard"
import YardCta from "@/app/components/fanzone/YardCta"
import { FanSiteNote, SectionHeading } from "@/app/components/fanzone/ui"

// Refresh data at most once a minute.
export const revalidate = 60

const intro = "Reality TV news, gossip, polls and rankings for fans of every show, in one place."

export const metadata: Metadata = pageMetadata("Reality Reloaded", intro, "/fanzone")

export default async function RealityReloaded() {
  const [shows, stories, events] = await Promise.all([getShows(), getTopStories(6), getUpcomingEvents()])
  const nextByShow = new Map(events.map((e) => [e.show?.slug, e]))

  return (
    <main className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-[110px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-[40rem] h-[30rem] w-[30rem] rounded-full bg-secondary/15 blur-[110px]" />

      <div className="relative mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6 md:py-16">
        <header>
          <h1 className="w-fit bg-gradient-to-r from-accent to-secondary bg-clip-text pb-2 font-heading text-4xl font-bold text-transparent sm:text-6xl">
            Reality Reloaded
          </h1>
          <p className="mt-4 max-w-prose text-lg leading-relaxed text-contrast/85">{intro}</p>
        </header>

        {shows === null && (
          <p role="status" className="rounded-2xl border border-contrast/15 p-5 text-contrast/80">
            Live updates are unavailable right now. Please check back in a few minutes.
          </p>
        )}

        <section aria-labelledby="top-stories">
          <SectionHeading id="top-stories" title="Top stories" intro="The latest news, gossip and talking points across every show." />
          {stories.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((post) => (
                <StoryCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-contrast/70">No stories yet. The first ones land soon.</p>
          )}
        </section>

        {shows && shows.length > 0 && (
          <section aria-labelledby="shows">
            <SectionHeading id="shows" title="Pick your show" intro="Polls, rankings, predictions and gossip for each show." />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shows.map((show) => (
                <ShowCard key={show.id} show={show} nextEvent={nextByShow.get(show.slug)} />
              ))}
            </div>
          </section>
        )}

        <YardCta />
      </div>
      <FanSiteNote />
    </main>
  )
}
