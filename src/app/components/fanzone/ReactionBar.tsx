"use client"

import { useEffect, useState } from "react"
import { REACTIONS } from "./fanFiction"
import { useTurnstile } from "./turnstile"
import { focusRing } from "./ui"

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const MINE_KEY = "rr-story-reactions"
const DEVICE_KEY = "rr-device-id"

function readMine(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(MINE_KEY) ?? "{}")
  } catch {
    return {}
  }
}
function deviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

// One reaction per reader per story; tapping another reaction switches it.
export default function ReactionBar({ storyId, initialCounts }: { storyId: string; initialCounts: Record<string, number> }) {
  const [counts, setCounts] = useState(initialCounts)
  const [mine, setMine] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const enabled = Boolean(SITE_KEY && SUPABASE_URL)
  const { containerRef, getToken, reset } = useTurnstile(SITE_KEY, enabled)

  // The page may be a cached copy up to a minute old, so fetch fresh counts once it loads.
  useEffect(() => {
    setMine(readMine()[storyId] ?? null)
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!SUPABASE_URL || !key) return
    fetch(`${SUPABASE_URL}/rest/v1/rpc/story_reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({ p_story_id: storyId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((rows: { reaction: string; total: number }[] | null) => {
        if (rows) setCounts(Object.fromEntries(rows.map((r) => [r.reaction, Number(r.total)])))
      })
      .catch(() => {})
  }, [storyId])

  async function react(value: string) {
    if (busy || !enabled || value === mine) return
    setBusy(true)
    setMessage("")
    try {
      const token = await getToken()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_id: storyId, reaction: value, device_id: deviceId(), token }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error()
      setCounts(body.counts ?? {})
      setMine(value)
      try {
        localStorage.setItem(MINE_KEY, JSON.stringify({ ...readMine(), [storyId]: value }))
      } catch {}
      setMessage("Thanks for reacting!")
    } catch {
      setMessage("Couldn't save your reaction. Please try again.")
    } finally {
      reset()
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-contrast">What did you think?</p>
      <div role="group" aria-label="React to this story" className="mt-2 flex flex-wrap gap-2">
        {REACTIONS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => react(r.value)}
            disabled={!enabled || busy}
            aria-pressed={mine === r.value}
            aria-label={`${r.label}, ${counts[r.value] ?? 0}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-60 motion-reduce:transition-none ${focusRing} ${
              mine === r.value ? "border-accent bg-accent/20 text-contrast" : "border-contrast/15 text-contrast/85 hover:border-contrast/35"
            }`}
          >
            <span aria-hidden="true">{r.emoji}</span>
            <span className="tabular-nums">{counts[r.value] ?? 0}</span>
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-contrast/75">
        {message}
      </p>
      <div ref={containerRef} className="empty:hidden" />
    </div>
  )
}
