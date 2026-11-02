import Image from "next/image"
import Link from "next/link"

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"

interface ComingSoonProps {
  title: string
  intro: string
  status: string
  upcoming: string[]
  image: string
}

// Intentional placeholder for a creative section that is still in development.
// Replace with the section's real content when it is ready.
export default function ComingSoon({ title, intro, status, upcoming, image }: ComingSoonProps) {
  return (
    <main className="relative overflow-hidden">
      {/* Soft brand glow; static so it never competes with reading. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-secondary/15 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1fr_minmax(0,24rem)] lg:gap-16">
        <div className="relative order-first h-56 overflow-hidden rounded-2xl sm:h-72 lg:order-last lg:h-[32rem]">
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 24rem, 100vw"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-base via-base/20 to-transparent" />
        </div>

        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-contrast/15 px-3 py-1 text-sm text-contrast/80">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
            {status}
          </p>

          <h1 className="mt-5 w-fit bg-gradient-to-r from-accent to-secondary bg-clip-text pb-2 font-heading text-4xl font-bold text-transparent sm:text-6xl">
            {title}
          </h1>

          <p className="mt-5 max-w-prose text-lg leading-relaxed text-contrast/85">{intro}</p>

          <h2 className="mt-10 font-heading text-lg font-bold text-contrast">What’s coming</h2>
          <ul className="mt-4 space-y-3">
            {upcoming.map((item) => (
              <li key={item} className="flex gap-3 text-contrast/80">
                <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-accent" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-contrast/10 pt-6">
            <Link
              href="/"
              className={`rounded-lg bg-accent px-5 py-3 font-medium text-contrast transition-colors hover:bg-accent/85 motion-reduce:transition-none ${focusRing}`}
            >
              Back to the hub
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
