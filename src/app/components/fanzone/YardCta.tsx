// Invitation to The Yard. The waitlist form is added once a form endpoint exists;
// until then this sets expectations without a button that goes nowhere.
export default function YardCta({ showName }: { showName?: string }) {
  return (
    <section aria-labelledby="yard-cta" className="relative overflow-hidden rounded-3xl border border-contrast/10 p-8 sm:p-10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-contrast/15 px-3 py-1 text-xs text-contrast/85">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-secondary" />
          Coming soon
        </p>
        <h2 id="yard-cta" className="mt-4 font-heading text-2xl font-bold text-contrast sm:text-3xl">
          {showName ? `Running a ${showName} fanbase? Give it a home.` : "Give your fanbase a home"}
        </h2>
        <p className="mt-3 leading-relaxed text-contrast/80">
          The Yard is where fanbases organise their votes, track who shows up and crown their most loyal fans every
          week. One yard per fanbase, free for every Resident to join.
        </p>
      </div>
    </section>
  )
}
