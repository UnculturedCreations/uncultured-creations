import Link from "next/link"
import { pillars } from "@/app/data/navigation"

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"

export default function Footer() {
  return (
    <footer className="border-t border-contrast/10 bg-base text-contrast">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <Link
            href="/"
            className={`rounded-sm font-heading text-xl font-bold ${focusRing}`}
          >
            Uncultured Creations
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-contrast/70">
            A hub of bold storytelling, unapologetic fandom, and raw creativity.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="font-heading text-sm font-bold text-contrast">Explore</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 md:grid-cols-2">
            {pillars.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`rounded-sm text-sm text-contrast/70 transition-colors hover:text-contrast motion-reduce:transition-none ${focusRing}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-contrast/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 text-xs text-contrast/60 sm:px-6">
          <p>© {new Date().getFullYear()} Uncultured Creations</p>
          <div className="flex gap-5">
            <Link href="/privacy" className={`rounded-sm hover:text-contrast ${focusRing}`}>
              Privacy
            </Link>
            <Link href="/editor" className={`rounded-sm hover:text-contrast ${focusRing}`}>
              Editors
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
