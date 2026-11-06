import type { Metadata } from "next"
import { CONTACT_EMAIL, pageMetadata } from "@/app/data/site"
import { getShows } from "@/lib/realityReloaded"
import SubmitStoryForm from "@/app/components/fanzone/SubmitStoryForm"
import { FAN_FICTION_RULES } from "@/app/components/fanzone/fanFiction"
import { FanSiteNote } from "@/app/components/fanzone/ui"

export const revalidate = 300

const intro = "Write your own story set in the world of your favourite reality show. Approved stories are published on Reality Reloaded under your pen name."

export const metadata: Metadata = pageMetadata("Submit your fan fiction", intro, "/fanzone/fiction/submit")

export default async function SubmitFiction({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const shows = ((await getShows()) ?? []).filter((s) => s.status !== "coming_soon")
  const { show } = await searchParams
  const defaultShowId = shows.find((s) => s.slug === show)?.id

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <h1 className="w-fit bg-gradient-to-r from-accent to-secondary bg-clip-text pb-2 font-heading text-4xl font-bold text-transparent sm:text-5xl">
        Submit your fan fiction
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-contrast/85">{intro}</p>

      <section aria-labelledby="rules" className="mt-8 rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-6">
        <h2 id="rules" className="font-heading text-xl font-bold text-contrast">
          The rules
        </h2>
        <p className="mt-1 text-sm text-contrast/70">These stories are about real people, so every one is read by an editor before it&apos;s published.</p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-contrast/85">
          {FAN_FICTION_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="your-story" className="mt-10">
        <h2 id="your-story" className="mb-5 font-heading text-2xl font-bold text-contrast">
          Your story
        </h2>
        <SubmitStoryForm shows={shows.map((s) => ({ id: s.id, name: s.name }))} enabled={Boolean(CONTACT_EMAIL)} defaultShowId={defaultShowId} />
      </section>
      <FanSiteNote />
    </main>
  )
}
