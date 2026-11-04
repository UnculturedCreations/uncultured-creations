"use client"

import { useEffect, useId, useRef, useState } from "react"
import type { Poll } from "@/lib/realityReloaded"
import { loadTurnstile, type TurnstileApi } from "./turnstile"
import { HousemateAvatar, focusRing } from "./ui"

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const VOTES_KEY = "rr-poll-votes"
const DEVICE_KEY = "rr-device-id"

type Phase = "idle" | "submitting" | "error"

// Browser storage can be unavailable (private modes, blocked storage); fail quietly.
function readVotes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(VOTES_KEY) ?? "{}")
  } catch {
    return {}
  }
}
function saveVote(pollId: string, optionId: string) {
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify({ ...readVotes(), [pollId]: optionId }))
  } catch {}
}
let sessionDeviceId: string | null = null
function deviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
    return id
  } catch {
    sessionDeviceId ??= crypto.randomUUID()
    return sessionDeviceId
  }
}

export default function PollCard({ poll }: { poll: Poll }) {
  const groupId = useId()
  const [selected, setSelected] = useState<string | null>(null)
  const [votedFor, setVotedFor] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, number> | null>(poll.results)
  const [phase, setPhase] = useState<Phase>("idle")
  const [message, setMessage] = useState("")
  const widgetEl = useRef<HTMLDivElement>(null)
  const widget = useRef<{ api: TurnstileApi; id: string } | null>(null)
  const pendingToken = useRef<{ resolve: (t: string) => void; reject: () => void } | null>(null)

  const closed = poll.status === "closed"
  const canVote = !closed && !votedFor && Boolean(SITE_KEY && SUPABASE_URL)
  const revealAfterVote = poll.show_results === "after_vote"
  const showResults = results !== null && (closed || poll.show_results === "always" || (revealAfterVote && votedFor !== null))

  // Remember a vote made earlier on this device, and fetch totals if they're now visible.
  useEffect(() => {
    const previous = readVotes()[poll.id]
    if (!previous) return
    setVotedFor(previous)
    // A single small request instead of bundling the whole Supabase library in the browser.
    if (revealAfterVote && SUPABASE_URL && PUBLISHABLE_KEY) {
      fetch(`${SUPABASE_URL}/rest/v1/rpc/poll_results`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: PUBLISHABLE_KEY },
        body: JSON.stringify({ p_poll_id: poll.id }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { option_id: string; votes: number }[] | null) => {
          if (data) setResults(Object.fromEntries(data.map((r) => [r.option_id, Number(r.votes)])))
        })
        .catch(() => {})
    }
  }, [poll.id, revealAfterVote])

  // Prepare an invisible bot check; it only shows a challenge if Cloudflare needs one.
  useEffect(() => {
    if (!canVote || !widgetEl.current || !SITE_KEY) return
    let cancelled = false
    loadTurnstile()
      .then((api) => {
        if (cancelled || !widgetEl.current || widget.current) return
        const id = api.render(widgetEl.current, {
          sitekey: SITE_KEY,
          execution: "execute",
          appearance: "interaction-only",
          callback: (token) => pendingToken.current?.resolve(token),
          "error-callback": () => pendingToken.current?.reject(),
          "expired-callback": () => pendingToken.current?.reject(),
        })
        widget.current = { api, id }
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (widget.current) widget.current.api.remove(widget.current.id)
      widget.current = null
    }
  }, [canVote])

  function getToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!widget.current) return reject()
      const timer = setTimeout(reject, 30000)
      pendingToken.current = {
        resolve: (t) => (clearTimeout(timer), resolve(t)),
        reject: () => (clearTimeout(timer), reject()),
      }
      widget.current.api.execute(widget.current.id)
    })
  }

  async function vote() {
    if (!selected || !canVote) return
    setPhase("submitting")
    setMessage("")
    try {
      const token = await getToken()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cast-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poll_id: poll.id, option_id: selected, device_id: deviceId(), token }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        const counts: Record<string, number> = Object.fromEntries(
          ((body.results ?? []) as { option_id: string; votes: number }[]).map((r) => [r.option_id, Number(r.votes)]),
        )
        const choice = body.status === "already_voted" ? (readVotes()[poll.id] ?? selected) : selected
        saveVote(poll.id, choice)
        setVotedFor(choice)
        setResults(poll.show_results === "after_close" ? null : counts)
        setPhase("idle")
        setMessage(body.status === "already_voted" ? "You've already voted in this poll." : "Vote counted. Thanks!")
      } else if (res.status === 409) {
        setPhase("error")
        setMessage("This poll has closed.")
      } else if (res.status === 403) {
        setPhase("error")
        setMessage("We couldn't confirm you're not a bot. Please try again.")
      } else {
        setPhase("error")
        setMessage("Something went wrong. Please try again.")
      }
    } catch {
      setPhase("error")
      setMessage("We couldn't send your vote. Check your connection and try again.")
    } finally {
      if (widget.current) widget.current.api.reset(widget.current.id)
    }
  }

  const total = results ? Object.values(results).reduce((a, b) => a + b, 0) : 0

  return (
    <article className="rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-contrast/65">{closed ? "Final results" : "Fan poll"}</span>
        {showResults && <span className="text-xs text-contrast/65">{total} {total === 1 ? "vote" : "votes"}</span>}
      </div>
      <h3 id={`${groupId}-q`} className="mt-2 font-heading text-lg font-bold leading-snug text-contrast">
        {poll.question}
      </h3>

      {showResults ? (
        <ul className="mt-4 space-y-3">
          {poll.options.map((option) => {
            const votes = results?.[option.id] ?? 0
            const pct = total > 0 ? Math.round((votes / total) * 100) : 0
            const mine = option.id === votedFor
            return (
              <li key={option.id}>
                <div className="flex items-center gap-3">
                  {option.housemate && <HousemateAvatar name={option.housemate.name} color={option.housemate.color} size="sm" />}
                  <span className="min-w-0 flex-1 truncate text-sm text-contrast">
                    {option.label}
                    {mine && <span className="ml-2 text-xs text-contrast/65">(your vote)</span>}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-contrast">{pct}%</span>
                </div>
                <div aria-hidden="true" className="ml-11 mt-1 h-1.5 rounded-full bg-contrast/10">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-accent to-secondary" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      ) : votedFor ? (
        <p className="mt-4 text-sm text-contrast/80">
          {poll.show_results === "after_close"
            ? "Your vote is in. Results are revealed when the poll closes."
            : "Your vote is in."}
        </p>
      ) : (
        <fieldset className="mt-4" disabled={!canVote || phase === "submitting"}>
          <legend className="sr-only">{poll.question}</legend>
          <div className="space-y-2">
            {poll.options.map((option) => (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors motion-reduce:transition-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                  selected === option.id ? "border-accent bg-accent/10" : "border-contrast/10 hover:border-contrast/25"
                }`}
              >
                <input
                  type="radio"
                  name={groupId}
                  value={option.id}
                  checked={selected === option.id}
                  onChange={() => setSelected(option.id)}
                  className="sr-only"
                />
                {option.housemate && <HousemateAvatar name={option.housemate.name} color={option.housemate.color} size="sm" />}
                <span className="text-sm text-contrast">{option.label}</span>
              </label>
            ))}
          </div>
          {canVote ? (
            <button
              type="button"
              onClick={vote}
              disabled={!selected || phase === "submitting"}
              className={`mt-4 rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-opacity disabled:opacity-50 motion-reduce:transition-none ${focusRing}`}
            >
              {phase === "submitting" ? "Sending..." : "Vote"}
            </button>
          ) : (
            !closed && <p className="mt-4 text-sm text-contrast/70">Voting is unavailable right now.</p>
          )}
        </fieldset>
      )}

      <div ref={widgetEl} className="mt-3 empty:hidden" />
      <p role="status" aria-live="polite" className={`mt-3 min-h-[1.25rem] text-sm ${phase === "error" ? "text-[#FCA5A5]" : "text-contrast/80"}`}>
        {message}
      </p>
    </article>
  )
}
