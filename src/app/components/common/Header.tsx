"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { pillars } from "@/app/data/navigation"
import AccountLink from "./AccountLink"
import NotificationBell from "./NotificationBell"

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Header() {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [isOpen, setIsOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Close on Escape and return focus to the toggle button.
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [isOpen])

  return (
    <header
      className={
        isHome
          ? "absolute inset-x-0 top-0 z-50"
          : "sticky top-0 z-50 border-b border-contrast/10 bg-base/85 backdrop-blur-md"
      }
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        {isHome ? (
          // The landing page already presents the full logo and title.
          <span aria-hidden="true" />
        ) : (
          <Link
            href="/"
            className={`flex items-center gap-3 rounded-md ${focusRing}`}
          >
            <Image
              src="/images/landing/logo-temp.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9"
            />
            <span className="font-heading text-lg font-bold text-contrast">
              Uncultured Creations
            </span>
          </Link>
        )}

        <div className="hidden items-center gap-7 lg:flex">
        <nav aria-label="Main">
          <ul className="flex items-center gap-7">
            {pillars.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-sm border-b-2 py-1 text-sm font-medium transition-colors motion-reduce:transition-none ${focusRing} ${
                      active
                        ? "border-accent text-contrast"
                        : "border-transparent text-contrast/70 hover:text-contrast"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
          <NotificationBell className={`inline-flex rounded-full p-1.5 text-contrast/80 hover:text-contrast ${focusRing}`} />
          <AccountLink
            className={`inline-flex items-center gap-1.5 rounded-full border border-contrast/20 px-3 py-1.5 text-sm font-medium text-contrast hover:border-contrast/40 ${focusRing}`}
          />
        </div>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className={`-mr-2 rounded-md p-2 text-contrast lg:hidden ${focusRing}`}
        >
          {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </div>

      {isOpen && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-contrast/10 bg-base/95 backdrop-blur-md lg:hidden"
        >
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
            {!isHome && (
              <li>
                <Link
                  href="/"
                  className={`block rounded-md border-l-2 border-transparent py-3 pl-3 text-[1rem] text-contrast/70 hover:text-contrast ${focusRing}`}
                >
                  Home
                </Link>
              </li>
            )}
            {pillars.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md border-l-2 py-3 pl-3 text-[1rem] ${focusRing} ${
                      active
                        ? "border-accent text-contrast"
                        : "border-transparent text-contrast/70 hover:text-contrast"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
            <li className="mt-2 border-t border-contrast/10 pt-2">
              <NotificationBell variant="text" className={`flex items-center gap-2 rounded-md border-l-2 border-transparent py-3 pl-3 text-[1rem] text-contrast/90 hover:text-contrast ${focusRing}`} />
            </li>
            <li>
              <AccountLink className={`flex items-center gap-2 rounded-md border-l-2 border-transparent py-3 pl-3 text-[1rem] text-contrast/90 hover:text-contrast ${focusRing}`} />
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
