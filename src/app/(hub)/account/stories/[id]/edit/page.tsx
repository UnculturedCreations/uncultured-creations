import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CONTACT_EMAIL } from "@/app/data/site"
import { getActivePrompts, getShows } from "@/lib/realityReloaded"
import WriterStoryForm from "@/app/components/fanzone/WriterStoryForm"
import { focusRing } from "@/app/components/fanzone/ui"

export const metadata: Metadata = { title: "Edit your story | Uncultured Creations", robots: { index: false, follow: false } }

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [allShows, prompts] = await Promise.all([getShows(), getActivePrompts()])
  const shows = (allShows ?? []).filter((s) => s.status !== "coming_soon")
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <Link href="/account/stories" className={`inline-flex items-center gap-1.5 rounded-sm text-sm text-contrast/70 hover:text-contrast ${focusRing}`}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        My stories
      </Link>
      <h1 className="mb-8 mt-4 font-heading text-3xl font-bold text-contrast">Edit your story</h1>
      <WriterStoryForm
        storyId={id}
        shows={shows.map((s) => ({ id: s.id, name: s.name, accent: s.accent_color }))}
        prompts={prompts.map((p) => ({ id: p.id, title: p.title }))}
        enabled={Boolean(CONTACT_EMAIL)}
      />
    </main>
  )
}
