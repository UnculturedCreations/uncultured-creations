import { ExternalLink } from "lucide-react"
import type { Post } from "@/lib/realityReloaded"
import { KindBadge, ShowTag, focusRing, timeAgo } from "./ui"

// A post: our own headline and summary, linking out to the original source when there is one.
export default function StoryCard({ post, showShowTag = true }: { post: Post; showShowTag?: boolean }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <KindBadge kind={post.kind} />
        {showShowTag && post.show && <ShowTag name={post.show.short_name ?? post.show.name} accent={post.show.accent_color} />}
        <span className="text-xs text-contrast/60">{timeAgo(post.published_at)}</span>
      </div>
      <h3 className="mt-3 font-heading text-lg font-bold leading-snug text-contrast">{post.title}</h3>
      {post.summary && <p className="mt-2 text-sm leading-relaxed text-contrast/75">{post.summary}</p>}
      {post.source_url && (
        <a
          href={post.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-auto inline-flex items-center gap-1.5 self-start rounded-sm pt-4 text-sm font-medium text-contrast/85 underline-offset-4 hover:text-contrast hover:underline ${focusRing}`}
        >
          Read on {post.source_name ?? "the source site"}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </article>
  )
}
