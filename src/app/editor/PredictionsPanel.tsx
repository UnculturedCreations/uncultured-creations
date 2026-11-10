"use client"

import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button, Card, Field, Select, TextInput, currentSeason, formatDate, toLocalInput, useNotice, useShows, type EditorHousemate } from "./fields"

interface RoundRow {
  id: string
  show_id: string
  question: string
  points: number
  locks_at: string
  status: "draft" | "open" | "resolved"
  prediction_options: { id: string; label: string; is_correct: boolean; sort_order: number }[]
}

type Option = { id?: string; label: string; housemate_id: string } // id: an option that already exists
const MAX_OPTIONS = 50
const blank = (): Option[] => [
  { label: "", housemate_id: "" },
  { label: "", housemate_id: "" },
]

// Marking the result: tick the correct option(s), then confirm. Works again to correct a mistake.
function ResolveBox({ db, round, onDone }: { db: SupabaseClient; round: RoundRow; onDone: (msg: string, failed?: boolean, error?: { message?: string } | null) => void }) {
  const [correct, setCorrect] = useState<string[]>(round.prediction_options.filter((o) => o.is_correct).map((o) => o.id))
  const [busy, setBusy] = useState(false)
  async function confirm() {
    if (correct.length === 0) return onDone("Tick at least one correct answer.", true)
    setBusy(true)
    const { data, error } = await db.rpc("resolve_round", { p_round_id: round.id, p_correct: correct })
    setBusy(false)
    if (error || data !== "ok") return onDone("Couldn't save the result.", true, error)
    onDone(round.status === "resolved" ? "Result corrected. The leaderboard has updated." : "Result saved. Points are on the leaderboard.")
  }
  return (
    <fieldset className="mt-3 rounded-xl border border-contrast/15 p-4">
      <legend className="px-1 text-sm font-medium text-contrast">Which answer was correct? Tick more than one for a double eviction.</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {[...round.prediction_options]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm text-contrast">
              <input
                type="checkbox"
                checked={correct.includes(o.id)}
                onChange={() => setCorrect(correct.includes(o.id) ? correct.filter((c) => c !== o.id) : [...correct, o.id])}
                className="h-4 w-4 accent-[#4ADE80]"
              />
              {o.label}
            </label>
          ))}
      </div>
      <Button className="mt-3" onClick={confirm} disabled={busy}>
        {round.status === "resolved" ? "Save corrected result" : "Confirm result"}
      </Button>
    </fieldset>
  )
}

export default function PredictionsPanel({ db, userId }: { db: SupabaseClient; userId: string }) {
  const { shows } = useShows(db)
  const { ok, fail, clear, node } = useNotice()
  const [rounds, setRounds] = useState<RoundRow[]>([])
  const [picks, setPicks] = useState<Record<string, number>>({})
  const [resolving, setResolving] = useState<string | null>(null)
  const [showId, setShowId] = useState("")
  const [question, setQuestion] = useState("Who will be evicted this week?")
  const [points, setPoints] = useState("10")
  const [locksAt, setLocksAt] = useState("")
  const [options, setOptions] = useState<Option[]>(blank)
  const [season, setSeason] = useState<{ id: string; name: string } | null>(null)
  const [housemates, setHousemates] = useState<EditorHousemate[]>([])
  const [busy, setBusy] = useState(false)
  // Editing: the round being changed, its picks per option, and what it started as.
  const [editing, setEditing] = useState<{ id: string; status: RoundRow["status"]; picks: Record<string, number>; optionIds: string[]; points: number; locksAt: string } | null>(null)
  const totalPicks = editing ? Object.values(editing.picks).reduce((a, b) => a + b, 0) : 0
  const resolved = editing?.status === "resolved"
  const show = shows.find((s) => s.id === showId)
  const stillIn = housemates.filter((h) => h.status === "in_house")

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
      .from("prediction_rounds")
      .select("id, show_id, question, points, locks_at, status, prediction_options(id, label, is_correct, sort_order)")
      .order("locks_at", { ascending: false })
      .limit(30)
    if (error) fail("Couldn't load rounds.", error)
    const rows = (data ?? []) as RoundRow[]
    setRounds(rows)
    const totals: Record<string, number> = {}
    await Promise.all(
      rows.map(async (r) => {
        const { data: counts } = await db.rpc("round_pick_counts", { p_round_id: r.id })
        totals[r.id] = ((counts ?? []) as { picks: number }[]).reduce((a, c) => a + Number(c.picks), 0)
      }),
    )
    setPicks(totals)
  }, [db, fail])

  useEffect(() => {
    load()
  }, [load])

  const setOption = (i: number, patch: Partial<Option>) => setOptions(options.map((o, j) => (j === i ? { ...o, ...patch } : o)))

  async function create(open: boolean) {
    clear()
    const filled = options.filter((o) => o.label.trim())
    const pts = Number(points)
    if (!showId) return fail("Choose a show.")
    if (!question.trim()) return fail("Add a question.")
    if (filled.length < 2) return fail("Add at least two options.")
    if (!Number.isInteger(pts) || pts < 1 || pts > 100) return fail("Points must be a whole number from 1 to 100.")
    if (!locksAt) return fail("Set when picks lock, before the live show starts.")
    if (new Date(locksAt).getTime() <= Date.now()) return fail("The lock time is in the past.")
    setBusy(true)
    const { data: round, error } = await db
      .from("prediction_rounds")
      .insert({ show_id: showId, season_id: season?.id ?? null, question: question.trim(), points: pts, locks_at: new Date(locksAt).toISOString(), status: open ? "open" : "draft", created_by: userId })
      .select("id")
      .single()
    if (error || !round) {
      setBusy(false)
      return fail("Couldn't create the round.", error)
    }
    const { error: oError } = await db
      .from("prediction_options")
      .insert(filled.map((o, i) => ({ round_id: round.id, label: o.label.trim(), housemate_id: o.housemate_id || null, sort_order: i + 1 })))
    if (oError) {
      await db.from("prediction_rounds").delete().eq("id", round.id)
      setBusy(false)
      return fail("Couldn't save the options.", oError)
    }
    setBusy(false)
    ok(open ? "Round is open. It appears on the show page within a minute." : "Round saved as a draft.")
    setOptions(blank())
    setLocksAt("")
    load()
  }

  function resetForm() {
    setEditing(null)
    setQuestion("Who will be evicted this week?")
    setPoints("10")
    setLocksAt("")
    setOptions(blank())
  }

  async function edit(r: RoundRow) {
    clear()
    const { data, error } = await db
      .from("prediction_rounds")
      .select("id, show_id, question, points, locks_at, status, prediction_options(id, label, housemate_id, sort_order)")
      .eq("id", r.id)
      .single()
    if (error || !data) return fail("Couldn't open the round.", error)
    const { data: counts } = await db.rpc("round_pick_counts", { p_round_id: r.id })
    const picksByOption = Object.fromEntries(((counts ?? []) as { option_id: string; picks: number }[]).map((c) => [c.option_id, Number(c.picks)]))
    const opts = [...(data.prediction_options as { id: string; label: string; housemate_id: string | null; sort_order: number }[])].sort((a, b) => a.sort_order - b.sort_order)
    setShowId(data.show_id)
    setQuestion(data.question)
    setPoints(String(data.points))
    setLocksAt(toLocalInput(data.locks_at))
    setOptions(opts.map((o) => ({ id: o.id, label: o.label, housemate_id: o.housemate_id ?? "" })))
    setEditing({ id: data.id, status: data.status, picks: picksByOption, optionIds: opts.map((o) => o.id), points: data.points, locksAt: toLocalInput(data.locks_at) })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Saving an edit: existing options are updated in place, so fans' picks are kept.
  async function saveEdit() {
    if (!editing) return
    clear()
    const filled = options.filter((o) => o.label.trim())
    const pts = Number(points)
    if (!question.trim()) return fail("Add a question.")
    if (filled.length < 2) return fail("Keep at least two options.")
    if (!Number.isInteger(pts) || pts < 1 || pts > 100) return fail("Points must be a whole number from 1 to 100.")
    if (!locksAt) return fail("Set when picks lock.")
    if (!resolved && locksAt !== editing.locksAt && new Date(locksAt).getTime() <= Date.now()) return fail("The new lock time is in the past.")
    if (options.some((o) => o.id && !o.label.trim())) return fail("An existing option can't be left empty: fix its wording instead.")
    if (resolved && pts !== editing.points && !window.confirm(`Change this decided round from ${editing.points} to ${pts} points? Everyone who got it right is re-scored on the leaderboard straight away.`)) return
    setBusy(true)
    const { error } = await db
      .from("prediction_rounds")
      .update({
        ...(totalPicks === 0 ? { show_id: showId } : {}),
        question: question.trim(),
        points: pts,
        ...(resolved ? {} : { locks_at: new Date(locksAt).toISOString() }),
      })
      .eq("id", editing.id)
    if (error) {
      setBusy(false)
      return fail("Couldn't save the round.", error)
    }
    try {
      for (const [i, o] of filled.entries()) {
        const row = { label: o.label.trim(), housemate_id: o.housemate_id || null, sort_order: i + 1 }
        const { error: oError } = o.id
          ? await db.from("prediction_options").update(row).eq("id", o.id)
          : await db.from("prediction_options").insert({ ...row, round_id: editing.id })
        if (oError) throw oError
      }
      // Options taken out of the list are deleted, but never one that a fan picked.
      const dropped = editing.optionIds.filter((id) => !options.some((o) => o.id === id) && !editing.picks[id])
      if (dropped.length) {
        const { error: dError } = await db.from("prediction_options").delete().in("id", dropped)
        if (dError) throw dError
      }
    } catch (e) {
      setBusy(false)
      return fail("Couldn't save the options.", e as { message?: string })
    }
    setBusy(false)
    ok(resolved && pts !== editing.points ? "Round updated and the leaderboard re-scored." : "Round updated. Changes appear on the site within a minute.")
    resetForm()
    load()
  }

  async function openRound(r: RoundRow) {
    const { error } = await db.from("prediction_rounds").update({ status: "open" }).eq("id", r.id)
    if (error) return fail("Couldn't open the round.", error)
    ok("Round opened.")
    load()
  }

  async function remove(r: RoundRow) {
    if (!window.confirm(`Delete "${r.question}" and all its picks? Points from it are removed from the leaderboard. This can't be undone.`)) return
    const { error } = await db.from("prediction_rounds").delete().eq("id", r.id)
    if (error) return fail("Couldn't delete the round.", error)
    if (editing?.id === r.id) resetForm()
    ok("Round deleted.")
    load()
  }

  const showName = (id: string) => shows.find((s) => s.id === id)?.short_name ?? shows.find((s) => s.id === id)?.name ?? ""
  const stateOf = (r: RoundRow) =>
    r.status === "resolved" ? "Result in" : r.status === "draft" ? "Draft" : new Date(r.locks_at).getTime() <= Date.now() ? "Picks locked: waiting for the result" : `Open until ${formatDate(r.locks_at)}`

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">{editing ? "Edit prediction round" : "New prediction round"}</h2>
        <p className="mt-1 text-sm text-contrast/70">
          {editing
            ? totalPicks > 0
              ? `${totalPicks} ${totalPicks === 1 ? "fan has" : "fans have"} picked. You can fix wording${resolved ? " and points" : ", the lock time and points, and add options"}, but options someone picked can't be removed.`
              : resolved
                ? "This round is decided. You can fix wording and points."
                : "No picks yet, so everything can be changed."
            : "Signed-in fans pick one answer and can change it until picks lock. Lock picks before the live show starts."}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Show" hint={season ? `Counts towards the ${season.name} leaderboard.` : "No current season: the leaderboard counts all rounds for this show."}>
            {(id) => (
              <Select id={id} value={showId} disabled={totalPicks > 0} onChange={(e) => setShowId(e.target.value)}>
                {shows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <Field label="Points">{(id) => <TextInput id={id} type="number" min={1} max={100} value={points} onChange={(e) => setPoints(e.target.value)} />}</Field>
            <Field label="Picks lock at">{(id) => <TextInput id={id} type="datetime-local" value={locksAt} disabled={resolved} onChange={(e) => setLocksAt(e.target.value)} />}</Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Question" hint={`${question.length}/200`}>
              {(id) => <TextInput id={id} value={question} maxLength={200} onChange={(e) => setQuestion(e.target.value)} />}
            </Field>
          </div>
        </div>
        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-contrast">Options</legend>
          <div className="mt-2 space-y-3">
            {options.map((option, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_14rem_auto]">
                <TextInput aria-label={`Option ${i + 1}`} placeholder={`Option ${i + 1}`} value={option.label} maxLength={120} onChange={(e) => setOption(i, { label: e.target.value })} />
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
                <Button
                  variant="secondary"
                  disabled={options.length <= 2 || Boolean(option.id && editing?.picks[option.id])}
                  onClick={() => setOptions(options.filter((_, j) => j !== i))}
                  aria-label={`Remove option ${i + 1}`}
                  title={option.id && editing?.picks[option.id] ? "A fan picked this option, so it can't be removed" : undefined}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" disabled={options.length >= MAX_OPTIONS || resolved} onClick={() => setOptions([...options, { label: "", housemate_id: "" }])}>
              Add option
            </Button>
            {stillIn.length >= 2 && !editing && (
              <Button variant="secondary" onClick={() => setOptions(stillIn.slice(0, MAX_OPTIONS).map((h) => ({ label: h.name, housemate_id: h.id })))}>
                Add everyone still in the {show?.venue ?? "house"} ({stillIn.length})
              </Button>
            )}
          </div>
        </fieldset>
        <div className="mt-5 flex flex-wrap gap-3">
          {editing ? (
            <>
              <Button onClick={saveEdit} disabled={busy}>
                Save changes
              </Button>
              <Button variant="secondary" onClick={resetForm} disabled={busy}>
                Cancel editing
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => create(true)} disabled={busy}>
                Create and open
              </Button>
              <Button variant="secondary" onClick={() => create(false)} disabled={busy}>
                Save as draft
              </Button>
            </>
          )}
        </div>
        <div className="mt-3">{node}</div>
      </Card>

      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">Rounds</h2>
        {rounds.length === 0 ? (
          <p className="mt-3 text-sm text-contrast/70">No rounds yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-contrast/10">
            {rounds.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-contrast">{r.question}</p>
                    <p className="text-xs text-contrast/60">
                      {stateOf(r)} · {showName(r.show_id)} · {r.points} points · {picks[r.id] ?? 0} {picks[r.id] === 1 ? "pick" : "picks"}
                      {r.status === "resolved" && ` · Correct: ${r.prediction_options.filter((o) => o.is_correct).map((o) => o.label).join(", ")}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => edit(r)} aria-label={`Edit ${r.question}`}>
                      Edit
                    </Button>
                    {r.status === "draft" && (
                      <Button variant="secondary" onClick={() => openRound(r)} aria-label={`Open ${r.question}`}>
                        Open
                      </Button>
                    )}
                    {r.status !== "draft" && (
                      <Button variant="secondary" onClick={() => setResolving(resolving === r.id ? null : r.id)} aria-expanded={resolving === r.id} aria-label={`${r.status === "resolved" ? "Correct the result for" : "Mark the result for"} ${r.question}`}>
                        {r.status === "resolved" ? "Correct result" : "Mark result"}
                      </Button>
                    )}
                    <Button variant="danger" onClick={() => remove(r)} aria-label={`Delete ${r.question}`}>
                      Delete
                    </Button>
                  </div>
                </div>
                {resolving === r.id && (
                  <ResolveBox
                    db={db}
                    round={r}
                    onDone={(msg, failed, error) => {
                      if (failed) return fail(msg, error)
                      ok(msg)
                      setResolving(null)
                      load()
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
