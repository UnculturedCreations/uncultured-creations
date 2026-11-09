import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { ChapterSummary } from "@/lib/realityReloaded"
import { focusRing } from "./ui"

const chapterHref = (slug: string, n: number) => (n === 1 ? `/fanzone/fiction/${slug}` : `/fanzone/fiction/${slug}/chapter/${n}`)

// List of chapters (chapter 1 is the story page itself), with the current one marked.
export function ChapterList({ slug, chapters, current }: { slug: string; chapters: ChapterSummary[]; current: number }) {
  if (chapters.length === 0) return null
  const all = [{ number: 1, title: null as string | null }, ...chapters]
  return (
    <nav aria-label="Chapters" className="mt-6 rounded-xl border border-contrast/10 bg-contrast/[0.03] p-4">
      <p className="text-sm font-medium text-contrast">{all.length} chapters</p>
      <ol className="mt-2 flex flex-wrap gap-2">
        {all.map((c) => (
          <li key={c.number}>
            <Link
              href={chapterHref(slug, c.number)}
              aria-current={c.number === current ? "page" : undefined}
              className={`inline-flex rounded-full border px-3 py-1 text-sm ${focusRing} ${c.number === current ? "border-accent bg-accent/20 text-contrast" : "border-contrast/15 text-contrast/80 hover:border-contrast/35"}`}
            >
              {c.number}
              {c.title ? `. ${c.title}` : ""}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Previous / next chapter links at the end of a chapter.
export function ChapterPager({ slug, total, current }: { slug: string; total: number; current: number }) {
  if (total <= 1) return null
  return (
    <nav aria-label="Chapter navigation" className="mt-10 flex flex-wrap items-center justify-between gap-4">
      {current > 1 ? (
        <Link href={chapterHref(slug, current - 1)} className={`inline-flex items-center gap-2 rounded-lg border border-contrast/20 px-4 py-2.5 text-sm font-medium text-contrast hover:border-contrast/40 ${focusRing}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Chapter {current - 1}
        </Link>
      ) : (
        <span />
      )}
      {current < total && (
        <Link href={chapterHref(slug, current + 1)} className={`inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white ${focusRing}`}>
          Next: chapter {current + 1}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </nav>
  )
}
