import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { pageMetadata } from "@/app/data/site"
import { getPostBySlug } from "@/lib/realityReloaded"
import { FanSiteNote, KindBadge, ShowTag, focusRing } from "@/app/components/fanzone/ui"

// Refresh at most once a minute, like the rest of Reality Reloaded.
export const revalidate = 60

type Params = { params: Promise<{ slug: string }> }

// Stories are rendered on their first visit, then served from cache and refreshed every
// minute, so a viral story doesn't hit the database on every view.
export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const { post, available } = await getPostBySlug(slug)
  if (!available) return { title: "Reality Reloaded | Uncultured Creations" }
  if (!post) return { title: "Page not found | Uncultured Creations" }
  const description = post.summary ?? `${post.title}, on Reality Reloaded.`
  const meta = pageMetadata(post.title, description, `/fanzone/stories/${post.slug}`)
  // Use the story's own image for link previews when it has one.
  if (post.image_url) {
    const image = { url: post.image_url, width: 1200, height: 630, alt: post.image_alt ?? post.title }
    meta.openGraph = { ...meta.openGraph, type: "article", publishedTime: post.published_at, images: [image] }
    meta.twitter = { ...meta.twitter, images: [image] }
  } else {
    meta.openGraph = { ...meta.openGraph, type: "article", publishedTime: post.published_at }
  }
  return meta
}

// Plain-text story: blank lines separate paragraphs, single line breaks are kept.
function Body({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className="whitespace-pre-line">
            {para}
          </p>
        ))}
    </>
  )
}

export default async function StoryPage({ params }: Params) {
  const { slug } = await params
  const { post, available } = await getPostBySlug(slug)
  if (!available) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <p role="status" className="rounded-2xl border border-contrast/15 p-5 text-contrast/80">
          This story is unavailable right now. Please check back in a few minutes.
        </p>
      </main>
    )
  }
  if (!post) notFound()

  const back = post.show ? { href: `/fanzone/${post.show.slug}`, label: post.show.name } : { href: "/fanzone", label: "Reality Reloaded" }
  const published = new Date(post.published_at)

  return (
    <main>
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <Link href={back.href} className={`inline-flex items-center gap-1.5 rounded-sm text-sm text-contrast/70 hover:text-contrast ${focusRing}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {back.label}
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <KindBadge kind={post.kind} />
            {post.show && <ShowTag name={post.show.short_name ?? post.show.name} accent={post.show.accent_color} />}
            <time dateTime={post.published_at} className="text-sm text-contrast/60">
              {published.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
            </time>
          </div>
          <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-contrast sm:text-5xl">{post.title}</h1>
          {post.summary && <p className="mt-5 text-lg leading-relaxed text-contrast/85">{post.summary}</p>}
        </header>

        {post.image_url && (
          // Feature images are resized to 1200 x 630 when uploaded.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image_url} alt={post.image_alt ?? ""} width={1200} height={630} className="mt-8 aspect-[1200/630] w-full rounded-2xl object-cover" />
        )}

        {post.body && (
          <div className="mt-8 space-y-5 text-[1rem] leading-relaxed text-contrast/90 sm:text-lg">
            <Body text={post.body} />
          </div>
        )}

        {post.source_url && (
          <p className="mt-10 border-t border-contrast/10 pt-6 text-sm text-contrast/75">
            Source:{" "}
            <a href={post.source_url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 rounded-sm font-medium text-contrast underline underline-offset-4 ${focusRing}`}>
              {post.source_name ?? "Read the original story"}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </p>
        )}
      </article>
      <FanSiteNote />
    </main>
  )
}
