import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { pageMetadata } from "@/app/data/site"
import { getChapter, getFanStoryBySlug, getStoryChapters } from "@/lib/realityReloaded"
import { FICTION_DISCLAIMER, readingMinutes } from "@/app/components/fanzone/fanFiction"
import { ChapterList, ChapterPager } from "@/app/components/fanzone/ChapterNav"
import { FanSiteNote, focusRing } from "@/app/components/fanzone/ui"

export const revalidate = 60
type Params = { params: Promise<{ slug: string; number: string }> }

export async function generateStaticParams() {
  return []
}

async function load(slug: string, numberParam: string) {
  const number = Number(numberParam)
  if (!Number.isInteger(number) || number < 2 || number > 999) return null
  const { story } = await getFanStoryBySlug(slug)
  if (!story) return null
  const [chapter, chapters] = await Promise.all([getChapter(story.id, number), getStoryChapters(story.id)])
  return chapter ? { story, chapter, chapters } : null
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, number } = await params
  const found = await load(slug, number)
  if (!found) return { title: "Page not found | Uncultured Creations" }
  const { story, chapter } = found
  return pageMetadata(`${story.title}, chapter ${chapter.number} (fan fiction)`, `Chapter ${chapter.number}${chapter.title ? `: ${chapter.title}` : ""} of a fan fiction story by ${story.pen_name}.`, `/fanzone/fiction/${story.slug}/chapter/${chapter.number}`)
}

export default async function ChapterPage({ params }: Params) {
  const { slug, number } = await params
  const found = await load(slug, number)
  if (!found) notFound()
  const { story, chapter, chapters } = found

  return (
    <main>
      <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 md:py-14">
        <Link href={`/fanzone/fiction/${story.slug}`} className={`inline-flex items-center gap-1.5 rounded-sm text-sm text-contrast/70 hover:text-contrast ${focusRing}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {story.title}
        </Link>
        <header className="mt-6">
          <span className="rounded-md bg-secondary/20 px-2 py-0.5 text-xs font-medium text-contrast">Fan fiction</span>
          <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-contrast sm:text-4xl">
            Chapter {chapter.number}
            {chapter.title ? `: ${chapter.title}` : ""}
          </h1>
          <p className="mt-3 text-contrast/75">
            {story.title} · by <span className="font-medium text-contrast">{story.pen_name}</span> · {readingMinutes(chapter.word_count)} min read
          </p>
          <ChapterList slug={story.slug} chapters={chapters} current={chapter.number} />
          <p className="mt-6 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-contrast/85">{FICTION_DISCLAIMER}</p>
        </header>
        <div className="mt-8 space-y-5 text-[1rem] leading-relaxed text-contrast/90 sm:text-lg">
          {chapter.body
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
        </div>
        <ChapterPager slug={story.slug} total={chapters.length + 1} current={chapter.number} />
        <p className="mt-10 border-t border-contrast/10 pt-6 text-sm text-contrast/75">
          Reactions and comments are on{" "}
          <Link href={`/fanzone/fiction/${story.slug}`} className={`rounded-sm underline underline-offset-4 hover:text-contrast ${focusRing}`}>
            the story&apos;s main page
          </Link>
          .
        </p>
      </article>
      <FanSiteNote />
    </main>
  )
}
