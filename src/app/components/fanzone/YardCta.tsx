import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { focusRing } from "./ui"

// Invitation to The Yard, linking to the early-access sign-up.
export default function YardCta({ showName }: { showName?: string }) {
  return (
    <section aria-labelledby="yard-cta" className="relative overflow-hidden rounded-3xl border border-contrast/10 p-8 sm:p-10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-contrast/15 px-3 py-1 text-xs text-contrast/85">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-secondary" />
          Early access, free
        </p>
        <h2 id="yard-cta" className="mt-4 font-heading text-2xl font-bold text-contrast sm:text-3xl">
          {showName ? `Running a ${showName} fanbase? Give it a home.` : "Give your fanbase a home"}
        </h2>
        <p className="mt-3 leading-relaxed text-contrast/80">
          The Yard is where fanbases organise their votes, track who shows up and crown their most loyal fans every
          week. One yard per fanbase, free for every Resident to join.
        </p>
        <Link
          href="/fanzone/the-yard"
          className={`mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-medium text-white transition-colors hover:bg-accent/85 motion-reduce:transition-none ${focusRing}`}
        >
          Join early access
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
