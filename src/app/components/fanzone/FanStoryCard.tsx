import Link from "next/link"
import type { FanStory } from "@/lib/realityReloaded"
import FanStoryCover from "./FanStoryCover"
import { genreLabel, readingMinutes } from "./fanFiction"
import { focusRing } from "./ui"

export default function FanStoryCard({ story }: { story: FanStory }) {
  return (
    <article className="relative flex h-full gap-4 rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-4 transition-colors hover:border-contrast/25 hover:bg-contrast/[0.06] motion-reduce:transition-none has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent">
      <FanStoryCover title={story.title} penName={story.pen_name} accent={story.show?.accent_color ?? null} coverUrl={story.cover_url} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-1.5">
          {story.featured && <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-white">Editor&apos;s pick</span>}
          {story.genres.map((g) => (
            <span key={g} className="rounded-md bg-secondary/20 px-2 py-0.5 text-xs text-contrast">
              {genreLabel(g)}
            </span>
          ))}
        </div>
        <h3 className="mt-2 font-heading text-lg font-bold leading-snug text-contrast">
          <Link href={`/fanzone/fiction/${story.slug}`} className={`after:absolute after:inset-0 focus-visible:outline-none ${focusRing}`}>
            {story.title}
          </Link>
        </h3>
        <p className="mt-0.5 text-sm text-contrast/70">by {story.pen_name}</p>
        {story.blurb && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-contrast/75">{story.blurb}</p>}
        <p className="mt-auto pt-3 text-xs text-contrast/60">
          {readingMinutes(story.word_count)} min read
          {story.reaction_total > 0 && (
            <>
              {" · "}
              <span aria-label={`${story.reaction_total} reactions`}>❤️ {story.reaction_total}</span>
            </>
          )}
          {story.show && ` · ${story.show.short_name ?? story.show.name}`}
        </p>
      </div>
    </article>
  )
}
