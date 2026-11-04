"use client"

import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button, Card, Field, Select, TextInput, currentSeason, useNotice, useShows, type EditorHousemate } from "./fields"

interface PollRow {
  id: string
  show_id: string
  question: string
  status: "draft" | "open" | "closed"
  show_results: string
  is_sample: boolean
  poll_options: { id: string }[]
}

const RESULTS = [
  { value: "after_vote", label: "After voting" },
  { value: "always", label: "Always" },
  { value: "after_close", label: "Only when the poll closes" },
]

type Option = { label: string; housemate_id: string }
const blankOptions = (): Option[] => [
  { label: "", housemate_id: "" },
  { label: "", housemate_id: "" },
]

export default function PollsPanel({ db, userId }: { db: SupabaseClient; userId: string }) {
  const { shows } = useShows(db)
  const { ok, fail, clear, node: noticeNode } = useNotice()
  const [polls, setPolls] = useState<PollRow[]>([])
  const [showId, setShowId] = useState("")
  const [question, setQuestion] = useState("")
  const [showResults, setShowResults] = useState("after_vote")
  const [options, setOptions] = useState<Option[]>(blankOptions)
  const [season, setSeason] = useState<{ id: string; name: string } | null>(null)
  const [housemates, setHousemates] = useState<EditorHousemate[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!showId && shows[0]) setShowId(shows[0].id)
  }, [shows, showId])

  useEffect(() => {
    if (!showId) return
    currentSeason(db, showId).then(({ season, housemates }) => {
      setSeason(season)
      setHousemates(housemates)
    })
  }, [db, showId])

  const load = useCallback(async () => {
    const { data, error } = await db
      .from("polls")
      .select("id, show_id, question, status, show_results, is_sample, poll_options(id)")
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) fail("Couldn't load polls.", error)
    setPolls((data ?? []) as PollRow[])
  }, [db, fail])

  useEffect(() => {
    load()
  }, [load])

  const setOption = (i: number, patch: Partial<Option>) =>
    setOptions(options.map((o, j) => (j === i ? { ...o, ...patch } : o)))

  async function create(open: boolean) {
    clear()
    const filled = options.filter((o) => o.label.trim())
    if (!showId) return fail("Choose a show.")
    if (!question.trim()) return fail("Add a question.")
    if (filled.length < 2) return fail("Add at least two options.")
    setBusy(true)
    const { data: poll, error } = await db
      .from("polls")
      .insert({
        show_id: showId,
        season_id: season?.id ?? null,
        question: question.trim(),
        status: open ? "open" : "draft",
        show_results: showResults,
        created_by: userId,
      })
      .select("id")
      .single()
    if (error || !poll) {
      setBusy(false)
      return fail("Couldn't create the poll.", error)
    }
    const { error: optionsError } = await db.from("poll_options").insert(
      filled.map((o, i) => ({ poll_id: poll.id, label: o.label.trim(), housemate_id: o.housemate_id || null, sort_order: i + 1 })),
    )
    if (optionsError) {
      await db.from("polls").delete().eq("id", poll.id) // don't leave a poll without options
      setBusy(false)
      return fail("Couldn't save the poll options.", optionsError)
    }
    setBusy(false)
    ok(open ? "Poll is open. It appears on the show page within a minute." : "Poll saved as a draft.")
    setQuestion("")
    setOptions(blankOptions())
    load()
  }

  async function setStatus(poll: PollRow, status: PollRow["status"]) {
    const { error } = await db.from("polls").update({ status }).eq("id", poll.id)
    if (error) return fail("Couldn't update the poll.", error)
    ok(status === "open" ? "Poll opened." : status === "closed" ? "Poll closed. Final results are now shown." : "Poll moved to drafts.")
    load()
  }

  async function remove(poll: PollRow) {
    if (!window.confirm(`Delete "${poll.question}" and all its votes? This can't be undone.`)) return
    const { error } = await db.from("polls").delete().eq("id", poll.id)
    if (error) return fail("Couldn't delete the poll.", error)
    ok("Poll deleted.")
    load()
  }

  const showName = (id: string) => shows.find((s) => s.id === id)?.short_name ?? shows.find((s) => s.id === id)?.name ?? ""

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">New poll</h2>
        <p className="mt-1 text-sm text-contrast/70">Fans get one vote per device. Polls can’t be edited once created; delete and recreate instead.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Show" hint={season ? `Linked to ${season.name}.` : "No current season, so options can't link to housemates."}>
            {(id) => (
              <Select id={id} value={showId} onChange={(e) => setShowId(e.target.value)}>
                {shows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Show results">
            {(id) => (
              <Select id={id} value={showResults} onChange={(e) => setShowResults(e.target.value)}>
                {RESULTS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="sm:col-span-2">
            <Field label="Question" hint={`${question.length}/200`}>
              {(id) => <TextInput id={id} value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={200} />}
            </Field>
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-contrast">Options</legend>
          <div className="mt-2 space-y-3">
            {options.map((option, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_14rem_auto]">
                <TextInput
                  aria-label={`Option ${i + 1}`}
                  placeholder={`Option ${i + 1}`}
                  value={option.label}
                  maxLength={120}
                  onChange={(e) => setOption(i, { label: e.target.value })}
                />
                <Select
                  aria-label={`Housemate for option ${i + 1}`}
                  value={option.housemate_id}
                  disabled={housemates.length === 0}
                  onChange={(e) => {
                    const h = housemates.find((x) => x.id === e.target.value)
                    setOption(i, { housemate_id: e.target.value, label: option.label || h?.name || "" })
                  }}
                >
                  <option value="">No housemate</option>
                  {housemates.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </Select>
                <Button variant="secondary" disabled={options.length <= 2} onClick={() => setOptions(options.filter((_, j) => j !== i))} aria-label={`Remove option ${i + 1}`}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-3" disabled={options.length >= 8} onClick={() => setOptions([...options, { label: "", housemate_id: "" }])}>
            Add option
          </Button>
        </fieldset>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => create(true)} disabled={busy}>
            Create and open
          </Button>
          <Button variant="secondary" onClick={() => create(false)} disabled={busy}>
            Save as draft
          </Button>
        </div>
        <div className="mt-3">{noticeNode}</div>
      </Card>

      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">Polls</h2>
        {polls.length === 0 ? (
          <p className="mt-3 text-sm text-contrast/70">No polls yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-contrast/10">
            {polls.map((poll) => (
              <li key={poll.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-contrast">{poll.question}</p>
                  <p className="text-xs text-contrast/60">
                    {poll.status === "open" ? "Open" : poll.status === "closed" ? "Closed" : "Draft"} · {showName(poll.show_id)} · {poll.poll_options.length} options
                    {poll.is_sample && " · Sample"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {poll.status !== "open" && (
                    <Button variant="secondary" onClick={() => setStatus(poll, "open")} aria-label={`Open ${poll.question}`}>
                      Open
                    </Button>
                  )}
                  {poll.status === "open" && (
                    <Button variant="secondary" onClick={() => setStatus(poll, "closed")} aria-label={`Close ${poll.question}`}>
                      Close
                    </Button>
                  )}
                  <Button variant="danger" onClick={() => remove(poll)} aria-label={`Delete ${poll.question}`}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
