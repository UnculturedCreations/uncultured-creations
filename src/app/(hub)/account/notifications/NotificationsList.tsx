"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { SupabaseClient } from "@supabase/supabase-js"
import { NOTIFICATIONS_CHANGED } from "@/app/components/common/NotificationBell"
import { focusRing, timeAgo } from "@/app/components/fanzone/ui"

interface Notice {
  id: string
  kind: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

const ICON: Record<string, string> = {
  story_published: "🎉",
  chapter_published: "🎉",
  story_declined: "✏️",
  chapter_declined: "✏️",
  story_comment: "💬",
  prediction_result: "🎯",
  prediction_corrected: "🎯",
}

export default function NotificationsList() {
  const [db, setDb] = useState<SupabaseClient | null | undefined>(undefined)
  const [items, setItems] = useState<Notice[] | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        if (!localStorage.getItem("uc-auth")) return setDb(null)
      } catch {
        return setDb(null)
      }
      const { getFanClient } = await import("@/lib/supabaseFan")
      const client = getFanClient()
      const { data } = (await client?.auth.getSession()) ?? { data: { session: null } }
      if (!client || !data.session) return setDb(null)
      setDb(client)
      const { data: rows } = await client.from("notifications").select("id, kind, title, body, link, read_at, created_at").order("created_at", { ascending: false }).limit(100)
      setItems((rows ?? []) as Notice[])
      // Opening the page marks everything as read (new ones stay highlighted this visit).
      if ((rows ?? []).some((r) => !r.read_at)) {
        await client.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null)
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
      }
    })()
  }, [])

  async function clearAll() {
    if (!db || !window.confirm("Clear all your notifications?")) return
    await db.from("notifications").delete().not("id", "is", null)
    setItems([])
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
  }

  if (db === undefined) return <p className="text-contrast/70">Loading...</p>
  if (db === null) {
    return (
      <p className="text-contrast/80">
        <Link href="/account?next=/account/notifications" className={`rounded-sm font-medium text-contrast underline underline-offset-4 ${focusRing}`}>
          Sign in
        </Link>{" "}
        to see your notifications.
      </p>
    )
  }
  if (items === null) return <p className="text-contrast/70">Loading your notifications...</p>
  if (items.length === 0) return <p className="rounded-2xl border border-contrast/10 p-6 text-contrast/80">You&apos;re all caught up. Notifications about your stories, comments and predictions appear here.</p>

  return (
    <div>
      <ul className="space-y-3">
        {items.map((n) => {
          const content = (
            <>
              <span aria-hidden="true" className="text-xl">{ICON[n.kind] ?? "🔔"}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-contrast">
                  {!n.read_at && <span className="sr-only">New: </span>}
                  {n.title}
                </span>
                {n.body && <span className="mt-0.5 block text-sm text-contrast/75">{n.body}</span>}
                <span className="mt-1 block text-xs text-contrast/55">{timeAgo(n.created_at)}</span>
              </span>
              {!n.read_at && <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />}
            </>
          )
          const box = `flex gap-3 rounded-xl border p-4 ${n.read_at ? "border-contrast/10 bg-contrast/[0.02]" : "border-accent/40 bg-accent/10"}`
          return (
            <li key={n.id}>
              {n.link ? (
                <Link href={n.link} className={`${box} hover:border-contrast/30 ${focusRing}`}>
                  {content}
                </Link>
              ) : (
                <div className={box}>{content}</div>
              )}
            </li>
          )
        })}
      </ul>
      <button type="button" onClick={clearAll} className={`mt-6 rounded-lg border border-contrast/20 px-4 py-2 text-sm font-medium text-contrast hover:border-contrast/40 ${focusRing}`}>
        Clear all
      </button>
    </div>
  )
}
