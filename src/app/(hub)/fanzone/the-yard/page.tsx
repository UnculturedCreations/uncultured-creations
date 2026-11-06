import type { Metadata } from "next"
import { CONTACT_EMAIL, pageMetadata } from "@/app/data/site"
import { getShows } from "@/lib/realityReloaded"
import YardSignupForm from "@/app/components/fanzone/YardSignupForm"
import { FanSiteNote } from "@/app/components/fanzone/ui"

export const revalidate = 300

const intro = "One home for your fanbase: organise votes, track who shows up and crown your most loyal fans every week."

export const metadata: Metadata = pageMetadata("The Yard: early access", intro, "/fanzone/the-yard")

const FEATURES = [
  { title: "The Push", text: "Set a vote target for the week and watch the whole fanbase fill one progress bar together." },
  { title: "Verified votes", text: "Members log their votes with proof, so the numbers you share are numbers you can trust." },
  { title: "The Notice Board", text: "See who shows up for your fave, week after week, ranked by verified votes." },
  { title: "Weekly Crowning", text: "Your members vote each week for titles like Town Crier, Night Owl and Ballot Boss." },
  { title: "Posters", text: "Share designed cards on X when you hit a target or crown your top voters." },
]

export default async function TheYard() {
  const shows = ((await getShows()) ?? []).map((s) => ({ id: s.id, name: s.name }))

  return (
    <main className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-secondary/20 blur-[110px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-[36rem] h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-[110px]" />

      <div className="relative mx-auto max-w-5xl space-y-14 px-4 py-12 sm:px-6 md:py-16">
        <header className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-contrast/15 px-3 py-1 text-xs text-contrast/85">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-secondary" />
            Early access, free
          </p>
          <h1 className="mt-4 w-fit bg-gradient-to-r from-accent to-secondary bg-clip-text pb-2 font-heading text-4xl font-bold text-transparent sm:text-6xl">
            The Yard
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-contrast/85">{intro}</p>
          <p className="mt-3 text-contrast/75">
            The Yard is in development. Sign up to get early access for your fanbase, free while we build it with fanbases like yours.
          </p>
        </header>

        <section aria-labelledby="what-you-get">
          <h2 id="what-you-get" className="font-heading text-2xl font-bold text-contrast sm:text-3xl">
            What your yard will do
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-5">
                <h3 className="font-heading text-lg font-bold text-contrast">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-contrast/75">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="sign-up" className="rounded-3xl border border-contrast/10 bg-contrast/[0.03] p-6 sm:p-8">
          <h2 id="sign-up" className="font-heading text-2xl font-bold text-contrast sm:text-3xl">
            Get early access
          </h2>
          <p className="mb-6 mt-2 text-contrast/75">Takes under a minute. Fanbase leaders and fans are both welcome.</p>
          <YardSignupForm shows={shows} enabled={Boolean(CONTACT_EMAIL)} />
        </section>
      </div>
      <FanSiteNote />
    </main>
  )
}
