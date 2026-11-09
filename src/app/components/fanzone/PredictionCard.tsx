"use client"

import { useCallback, useEffect, useId, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Check } from "lucide-react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { PredictionRound } from "@/lib/realityReloaded"
import Countdown from "./Countdown"
import { HousemateAvatar, focusRing } from "./ui"

type Player = { db: SupabaseClient; userId: string; canPlay: boolean } | null

// Loads the sign-in library only for fans who are signed in on this device.
async function loadPlayer(): Promise<Player> {
  try {
    if (!localStorage.getItem("uc-auth")) return null
  } catch {
    return null
  }
  const { getFanClient } = await import("@/lib/supabaseFan")
  const db = getFanClient()
  if (!db) return null
  const { data } = await db.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) return null
  const { data: profile } = await db.from("profiles").select("name_confirmed, adult_confirmed_at").eq("id", userId).maybeSingle()
  return { db, userId, canPlay: Boolean(profile?.name_confirmed && profile?.adult_confirmed_at) }
}

export default function PredictionCard({ round }: { round: PredictionRound }) {
  const groupId = useId()
  const pathname = usePathname()
  const [player, setPlayer] = useState<Player | undefined>(undefined)
  const [pick, setPick] = useState<string | null>(null) // saved pick
  const [choice, setChoice] = useState<string | null>(null) // selected, not yet saved
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null)
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const refresh = useCallback(async () => {
    const p = await loadPlayer()
    setPlayer(p)
    if (!p) return
    const { data } = await p.db.from("predictions").select("option_id").eq("round_id", round.id).eq("user_id", p.userId).maybeSingle()
    setPick(data?.option_id ?? null)
    setChoice(data?.option_id ?? null)
  }, [round.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  const resolved = round.status === "resolved"
  const locked = resolved || (now !== null && new Date(round.locks_at).getTime() <= now)
  const counts = round.counts
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0
  const myOption = round.options.find((o) => o.id === pick)

  async function save() {
    if (!player || !choice || locked) return
    setBusy(true)
    setMessage(null)
    const { error } = pick
      ? await player.db.from("predictions").update({ option_id: choice }).eq("round_id", round.id).eq("user_id", player.userId)
      : await player.db.from("predictions").insert({ round_id: round.id, user_id: player.userId, option_id: choice })
    setBusy(false)
    if (error) {
      setMessage({ kind: "error", text: "Couldn't save your pick. If picks have just locked, refresh the page." })
      return
    }
    setPick(choice)
    setMessage({ kind: "ok", text: pick ? "Pick changed." : "Pick locked in. Good luck!" })
  }

  const signInHref = `/account?next=${encodeURIComponent(pathname ?? "/fanzone")}`

  return (
    <article className="rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-contrast/65">
        <span>
          Prediction · {round.points} points
        </span>
        {resolved ? (
          <span>Final result</span>
        ) : locked ? (
          <span>Picks closed</span>
        ) : (
          <span className="inline-flex items-center gap-1">
            Picks lock <Countdown startsAt={round.locks_at} />
          </span>
        )}
      </div>
      <h3 id={`${groupId}-q`} className="mt-2 font-heading text-lg font-bold leading-snug text-contrast">
        {round.question}
      </h3>

      {locked ? (
        <ul className="mt-4 space-y-2.5">
          {round.options.map((o) => {
            const n = counts?.[o.id] ?? 0
            const pct = total > 0 ? Math.round((n / total) * 100) : 0
            const correct = resolved && o.is_correct
            return (
              <li key={o.id}>
                <div className="flex items-center gap-3">
                  {o.housemate && <HousemateAvatar name={o.housemate.name} color={o.housemate.color} imageUrl={o.housemate.image_url} size="sm" />}
                  <span className={`min-w-0 flex-1 truncate text-sm ${correct ? "font-bold text-contrast" : "text-contrast/90"}`}>
                    {o.label}
                    {correct && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-[#4ADE80]">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Correct
                      </span>
                    )}
                    {o.id === pick && <span className="ml-2 text-xs text-contrast/65">(your pick)</span>}
                  </span>
                  {counts && <span className="text-sm tabular-nums text-contrast/80">{pct}%</span>}
                </div>
                {counts && (
                  <div aria-hidden="true" className="ml-11 mt-1 h-1.5 rounded-full bg-contrast/10">
                    <div className={`h-1.5 rounded-full ${correct ? "bg-[#4ADE80]" : "bg-gradient-to-r from-accent to-secondary"}`} style={{ width: `${pct}%` }} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <fieldset className="mt-4" disabled={!player?.canPlay || busy}>
          <legend className="sr-only">{round.question}</legend>
          <div className={round.options.length > 8 ? "grid gap-2 sm:grid-cols-2" : "space-y-2"}>
            {round.options.map((o) => (
              <label
                key={o.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                  choice === o.id ? "border-accent bg-accent/10" : "border-contrast/10 hover:border-contrast/25"
                }`}
              >
                <input type="radio" name={groupId} value={o.id} checked={choice === o.id} onChange={() => setChoice(o.id)} className="sr-only" />
                {o.housemate && <HousemateAvatar name={o.housemate.name} color={o.housemate.color} imageUrl={o.housemate.image_url} size="sm" />}
                <span className="text-sm text-contrast">{o.label}</span>
                {o.id === pick && <span className="ml-auto text-xs text-contrast/65">Your pick</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-4 text-sm">
        {resolved ? (
          pick && myOption ? (
            myOption.is_correct ? (
              <p className="font-medium text-[#4ADE80]">You called it: +{round.points} points.</p>
            ) : (
              <p className="text-contrast/80">Not this time. Better luck next round!</p>
            )
          ) : (
            <p className="text-contrast/70">This round is finished.</p>
          )
        ) : locked ? (
          <p className="text-contrast/75">{pick ? "Your pick is in. Results after the show." : "Picks are closed. Results after the show."}</p>
        ) : player === undefined ? null : !player ? (
          <p className="text-contrast/80">
            <Link href={signInHref} className={`rounded-sm font-medium text-contrast underline underline-offset-4 ${focusRing}`}>
              Sign in to play
            </Link>{" "}
            and climb the leaderboard.
          </p>
        ) : !player.canPlay ? (
          <p className="text-contrast/80">
            <Link href={signInHref} className={`rounded-sm font-medium text-contrast underline underline-offset-4 ${focusRing}`}>
              Finish setting up your account
            </Link>{" "}
            to play.
          </p>
        ) : (
          <button type="button" onClick={save} disabled={!choice || choice === pick || busy} className={`rounded-lg bg-accent px-5 py-2.5 font-medium text-white disabled:opacity-50 ${focusRing}`}>
            {busy ? "Saving..." : pick ? "Change my pick" : "Lock in my pick"}
          </button>
        )}
        <p role="status" aria-live="polite" className={`mt-2 min-h-[1.25rem] ${message?.kind === "error" ? "text-[#FCA5A5]" : "text-[#4ADE80]"}`}>
          {message?.text}
        </p>
      </div>
    </article>
  )
}
