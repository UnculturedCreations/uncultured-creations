import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/app/components/common/Header"
import Footer from "@/app/components/common/Footer"
import { pillars } from "@/app/data/navigation"

export const metadata: Metadata = {
  title: "Page not found | Uncultured Creations",
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-base text-contrast">
      <Header />
      <main id="content" className="flex flex-1 items-center px-4 py-20 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <p className="text-sm text-contrast/60">Error 404</p>
          <h1 className="mt-3 bg-gradient-to-r from-accent to-secondary bg-clip-text pb-1 font-heading text-4xl font-bold text-transparent sm:text-5xl">
            This page doesn&apos;t exist
          </h1>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-contrast/80">
            The link may be broken, or the page may have moved. Head back to the
            homepage or pick a section below.
          </p>

          <Link
            href="/"
            className={`mt-8 inline-block rounded-lg bg-accent px-5 py-3 font-medium text-contrast transition-colors hover:bg-accent/85 motion-reduce:transition-none ${focusRing}`}
          >
            Go to the homepage
          </Link>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-contrast/10 pt-6">
            {pillars.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`rounded-sm text-contrast/70 underline-offset-4 hover:text-contrast hover:underline ${focusRing}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  )
}
