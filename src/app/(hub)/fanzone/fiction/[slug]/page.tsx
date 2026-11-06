import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { CONTACT_EMAIL, pageMetadata } from "@/app/data/site"
import { getFanStoryBySlug } from "@/lib/realityReloaded"
import { FICTION_DISCLAIMER } from "@/app/components/fanzone/fanFiction"
import { FanSiteNote, ShowTag, focusRing } from "@/app/components/fanzone/ui"

export const revalidate = 60

type Params = { params: Promise<{ slug: string }> }

// Rendered on first visit, then cached and refreshed every minute.
export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const { story, available } = await getFanStoryBySlug(slug)
  if (!available) return { title: "Reality Reloaded | Uncultured Creations" }
  if (!story) return { title: "Page not found | Uncultured Creations" }
  const meta = pageMetadata(`${story.title} (fan fiction)`, story.blurb ?? `A fan fiction story by ${story.pen_name}, on Reality Reloaded.`, `/fanzone/fiction/${story.slug}`)
  meta.openGraph = { ...meta.openGraph, type: "article", publishedTime: story.published_at }
  return meta
}

export default async function FanStoryPage({ params }: Params) {
  const { slug } = await params
  const { story, available } = await getFanStoryBySlug(slug)
  if (!available) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <p role="status" className="rounded-2xl border border-contrast/15 p-5 text-contrast/80">
          This story is unavailable right now. Please check back in a few minutes.
        </p>
      </main>
    )
  }
  if (!story) notFound()

  const back = story.show ? { href: `/fanzone/${story.show.slug}`, label: story.show.name } : { href: "/fanzone", label: "Reality Reloaded" }
  const reportHref = CONTACT_EMAIL
    ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Report: ${story.title}`)}&body=${encodeURIComponent(`Story: /fanzone/fiction/${story.slug}\n\nWhat's the problem?\n`)}`
    : null

  return (
    <main>
      <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 md:py-14">
        <Link href={back.href} className={`inline-flex items-center gap-1.5 rounded-sm text-sm text-contrast/70 hover:text-contrast ${focusRing}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {back.label}
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="rounded-md bg-secondary/20 px-2 py-0.5 text-xs font-medium text-contrast">Fan fiction</span>
            {story.show && <ShowTag name={story.show.short_name ?? story.show.name} accent={story.show.accent_color} />}
          </div>
          <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-contrast sm:text-5xl">{story.title}</h1>
          <p className="mt-3 text-contrast/75">
            by <span className="font-medium text-contrast">{story.pen_name}</span> ·{" "}
            <time dateTime={story.published_at}>
              {new Date(story.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
            </time>
          </p>
          <p className="mt-6 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-contrast/85">{FICTION_DISCLAIMER}</p>
        </header>

        <div className="mt-8 space-y-5 text-[1rem] leading-relaxed text-contrast/90 sm:text-lg">
          {story.body
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
        </div>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-contrast/10 pt-6 text-sm">
          <Link
            href={`/fanzone/fiction/submit${story.show ? `?show=${story.show.slug}` : ""}`}
            className={`rounded-lg bg-accent px-5 py-2.5 font-medium text-white ${focusRing}`}
          >
            Write your own story
          </Link>
          {reportHref && (
            <a href={reportHref} className={`rounded-sm text-contrast/70 underline underline-offset-4 hover:text-contrast ${focusRing}`}>
              Report this story
            </a>
          )}
        </footer>
      </article>
      <FanSiteNote />
    </main>
  )
}
