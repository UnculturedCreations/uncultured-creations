import Link from "next/link"
import { ExternalLink } from "lucide-react"
import type { Post } from "@/lib/realityReloaded"
import { KindBadge, ShowTag, focusRing, timeAgo } from "./ui"

// A story card: the whole card opens the story page; the source link stays separately clickable.
export default function StoryCard({ post, showShowTag = true }: { post: Post; showShowTag?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-contrast/10 bg-contrast/[0.03] transition-colors hover:border-contrast/25 hover:bg-contrast/[0.06] motion-reduce:transition-none has-[a.story-link:focus-visible]:outline has-[a.story-link:focus-visible]:outline-2 has-[a.story-link:focus-visible]:outline-offset-2 has-[a.story-link:focus-visible]:outline-accent">
      {post.image_url && (
        // Feature images are resized to 1200 x 630 when uploaded.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image_url} alt="" width={1200} height={630} loading="lazy" decoding="async" className="aspect-[1200/630] w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <KindBadge kind={post.kind} />
          {showShowTag && post.show && <ShowTag name={post.show.short_name ?? post.show.name} accent={post.show.accent_color} />}
          <span className="text-xs text-contrast/60">{timeAgo(post.published_at)}</span>
        </div>
        <h3 className="mt-3 font-heading text-lg font-bold leading-snug text-contrast">
          {/* The link stretches over the whole card. */}
          <Link href={`/fanzone/stories/${post.slug}`} className="story-link after:absolute after:inset-0 focus-visible:outline-none">
            {post.title}
          </Link>
        </h3>
        {post.summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-contrast/75">{post.summary}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-sm">
          <span aria-hidden="true" className="font-medium text-contrast underline-offset-4 group-hover:underline">
            Read more
          </span>
          {post.source_url && (
            <a
              href={post.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`relative z-10 inline-flex items-center gap-1.5 rounded-sm text-contrast/70 underline-offset-4 hover:text-contrast hover:underline ${focusRing}`}
            >
              {post.source_name ?? "Source"}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
