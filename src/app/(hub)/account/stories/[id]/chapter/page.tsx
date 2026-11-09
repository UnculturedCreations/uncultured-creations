import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ChapterForm from "./ChapterForm"
import { focusRing } from "@/app/components/fanzone/ui"

export const metadata: Metadata = { title: "Add a chapter | Uncultured Creations", robots: { index: false, follow: false } }

export default async function ChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <Link href="/account/stories" className={`inline-flex items-center gap-1.5 rounded-sm text-sm text-contrast/70 hover:text-contrast ${focusRing}`}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        My stories
      </Link>
      <h1 className="mb-6 mt-4 font-heading text-3xl font-bold text-contrast">Write a chapter</h1>
      <ChapterForm storyId={id} />
    </main>
  )
}
