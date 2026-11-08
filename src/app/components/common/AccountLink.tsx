"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserRound } from "lucide-react"

const FAN_AUTH_KEY = "uc-auth"
// Fired by the account page whenever someone signs in or out.
export const AUTH_CHANGE_EVENT = "uc-auth-change"

// "Sign in" or "My account", decided by whether a saved sign-in exists in this browser.
// Deliberately doesn't load the Supabase library, so every page stays fast.
export default function AccountLink({ className, onNavigate }: { className: string; onNavigate?: () => void }) {
  const [signedIn, setSignedIn] = useState(false)
  const pathname = usePathname()
  useEffect(() => {
    const check = () => {
      try {
        setSignedIn(Boolean(localStorage.getItem(FAN_AUTH_KEY)))
      } catch {}
    }
    check()
    window.addEventListener(AUTH_CHANGE_EVENT, check)
    window.addEventListener("storage", check) // sign-in or out in another tab
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, check)
      window.removeEventListener("storage", check)
    }
  }, [pathname])
  return (
    <Link href="/account" onClick={onNavigate} className={className}>
      <UserRound className="h-4 w-4" aria-hidden="true" />
      {signedIn ? "My account" : "Sign in"}
    </Link>
  )
}
