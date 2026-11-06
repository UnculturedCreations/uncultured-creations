import Link from "next/link"
import type { FanStory } from "@/lib/realityReloaded"
import { focusRing, timeAgo } from "./ui"

export default function FanStoryCard({ story }: { story: FanStory }) {
  return (
    <article className="relative flex h-full flex-col rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-5 transition-colors hover:border-contrast/25 hover:bg-contrast/[0.06] motion-reduce:transition-none has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="rounded-md bg-secondary/20 px-2 py-0.5 text-xs font-medium text-contrast">Fan fiction</span>
        <span className="text-xs text-contrast/60">{timeAgo(story.published_at)}</span>
      </div>
      <h3 className="mt-3 font-heading text-lg font-bold leading-snug text-contrast">
        <Link href={`/fanzone/fiction/${story.slug}`} className={`after:absolute after:inset-0 focus-visible:outline-none ${focusRing}`}>
          {story.title}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-contrast/70">by {story.pen_name}</p>
      {story.blurb && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-contrast/75">{story.blurb}</p>}
    </article>
  )
}
