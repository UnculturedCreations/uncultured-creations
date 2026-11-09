"use client"

import { useEffect, useState } from "react"

// "You're #12 with 30 points": fetched only for fans signed in on this device.
export default function MyStanding({ showId, seasonId }: { showId: string; seasonId: string | null }) {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (!localStorage.getItem("uc-auth")) return
      } catch {
        return
      }
      const { getFanClient } = await import("@/lib/supabaseFan")
      const db = getFanClient()
      if (!db) return
      const { data: session } = await db.auth.getSession()
      if (!session.session) return
      const { data } = await db.rpc("season_leaderboard", { p_show_id: showId, p_season_id: seasonId, p_limit: 1 })
      const me = ((data ?? []) as { rank: number; points: number; is_me: boolean }[]).find((r) => r.is_me)
      let message: string
      if (me) {
        message = `You're #${me.rank} with ${me.points} ${Number(me.points) === 1 ? "point" : "points"}.`
      } else {
        // Not on the board yet: either no picks, or picks still waiting for a result.
        const { count } = await db.from("predictions").select("round_id", { count: "exact", head: true })
        message = count ? "Your picks are in. You'll join the leaderboard once results are in." : "Make a prediction to join the leaderboard."
      }
      if (!cancelled) setText(message)
    })()
    return () => {
      cancelled = true
    }
  }, [showId, seasonId])
  if (!text) return null
  return <p className="mb-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm font-medium text-contrast">{text}</p>
}
