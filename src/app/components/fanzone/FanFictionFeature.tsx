import Link from "next/link"
import { PenLine } from "lucide-react"
import type { FanStory, WritingPrompt } from "@/lib/realityReloaded"
import FanStoryCard from "./FanStoryCard"
import FanStoryCover from "./FanStoryCover"
import { focusRing } from "./ui"

// Fan fiction on the Reality Reloaded home: a banner with a fanned stack of the latest covers
// and this week's prompt, then story cards (editor's picks when there are any, otherwise the latest).
export default function FanFictionFeature({ latest, picks, prompt }: { latest: FanStory[]; picks: FanStory[]; prompt: WritingPrompt | null }) {
  const stack = latest.slice(0, 3)
  const cards = picks.length > 0 ? picks : latest
  // Positions for one, two or three covers: the newest sits in front.
  // Spreads are smaller on phones so the outer covers stay inside the banner.
  const layouts = [
    ["z-30 translate-x-0 rotate-0"],
    ["z-30 -translate-x-8 -rotate-6 sm:-translate-x-10", "z-20 translate-x-10 rotate-6 sm:translate-x-12"],
    ["z-30 translate-x-0 -rotate-2", "z-20 -translate-x-16 -rotate-12 sm:-translate-x-20", "z-10 translate-x-16 rotate-12 sm:translate-x-20"],
  ][Math.max(stack.length, 1) - 1]

  return (
    <section aria-labelledby="fan-fiction" className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-contrast/10 bg-contrast/[0.03]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-secondary/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid items-center gap-8 p-6 sm:p-8 md:grid-cols-[1fr_minmax(0,22rem)] md:gap-10 md:p-10">
          <div>
            <h2 id="fan-fiction" className="font-heading text-3xl font-bold text-contrast sm:text-4xl">
              Fan fiction
            </h2>
            <p className="mt-3 max-w-prose text-lg leading-relaxed text-contrast/85">
              Stories by reality TV fans, read and approved by our editors. What if the vote went the other way?
            </p>
            {prompt && (
              <p className="mt-5 flex max-w-prose items-start gap-2 text-sm text-contrast/85">
                <PenLine className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-medium text-contrast">This week&apos;s prompt: {prompt.title}.</span> {prompt.prompt}
                </span>
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link href="/fanzone/fiction" className={`rounded-lg bg-accent px-5 py-3 font-medium text-white ${focusRing}`}>
                Read fan fiction
              </Link>
              <Link
                href={prompt ? `/fanzone/fiction/submit?prompt=${prompt.id}${prompt.show ? `&show=${prompt.show.slug}` : ""}` : "/fanzone/fiction/submit"}
                className={`rounded-lg border border-contrast/20 px-5 py-3 font-medium text-contrast hover:border-contrast/40 ${focusRing}`}
              >
                {prompt ? "Write for this prompt" : "Write a story"}
              </Link>
            </div>
          </div>

          {/* Decorative: the latest covers, fanned like books on a table. */}
          <div aria-hidden="true" className="relative mx-auto flex h-56 w-full max-w-[20rem] items-center justify-center sm:h-64">
            {stack.length > 0 ? (
              stack.map((story, i) => (
                <div key={story.id} className={`absolute w-28 shadow-2xl sm:w-36 ${layouts[i]}`}>
                  <FanStoryCover title={story.title} penName={story.pen_name} accent={story.show?.accent_color ?? null} coverUrl={story.cover_url} size="stack" />
                </div>
              ))
            ) : (
              <div className={`absolute w-28 sm:w-36 ${layouts[0]}`}>
                <FanStoryCover title="Your story here" penName="Your pen name" accent={null} coverUrl={null} size="stack" />
              </div>
            )}
          </div>
        </div>
      </div>

      {cards.length > 0 && (
        <div>
          <h3 className="mb-4 font-heading text-xl font-bold text-contrast">{picks.length > 0 ? "Editor's picks" : "Latest stories"}</h3>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((story) => (
              <FanStoryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
