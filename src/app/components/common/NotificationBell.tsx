"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"

// Fired when notifications are read, so the bell updates straight away.
export const NOTIFICATIONS_CHANGED = "uc-notifications-changed"

// Unread count for fans signed in on this device; loads the sign-in library only for them.
export default function NotificationBell({ className, variant = "icon", onNavigate }: { className: string; variant?: "icon" | "text"; onNavigate?: () => void }) {
  const [unread, setUnread] = useState<number | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        if (!localStorage.getItem("uc-auth")) return setUnread(null)
      } catch {
        return
      }
      const { getFanClient } = await import("@/lib/supabaseFan")
      const db = getFanClient()
      if (!db) return
      const { data } = await db.auth.getSession()
      if (!data.session) return setUnread(null)
      const { count } = await db.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null)
      if (!cancelled) setUnread(count ?? 0)
    }
    check()
    window.addEventListener(NOTIFICATIONS_CHANGED, check)
    window.addEventListener("uc-auth-change", check)
    return () => {
      cancelled = true
      window.removeEventListener(NOTIFICATIONS_CHANGED, check)
      window.removeEventListener("uc-auth-change", check)
    }
  }, [pathname])

  if (unread === null) return null
  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
  return (
    <Link href="/account/notifications" onClick={onNavigate} aria-label={label} className={`relative ${className}`}>
      <Bell className="h-5 w-5" aria-hidden="true" />
      {variant === "text" && <span>Notifications{unread > 0 ? ` (${unread})` : ""}</span>}
      {variant === "icon" && unread > 0 && (
        <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.65rem] font-bold leading-none text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  )
}
