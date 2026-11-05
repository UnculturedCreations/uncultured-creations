"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button, Card, Field, Select, TextInput, toSquareJpeg, useNotice, useShows } from "./fields"
import { HousemateAvatar } from "@/app/components/fanzone/ui"

interface SeasonRow {
  id: string
  name: string
  starts_on: string | null
  ends_on: string | null
  is_current: boolean
  winner_name: string | null
  is_sample: boolean
}
interface HousemateRow {
  id: string
  name: string
  color: string | null
  image_url: string | null
  status: string
  exit_week: number | null
  sort_order: number
}
interface CategoryRow {
  id: string
  name: string
  description: string | null
  higher_is_better: boolean
  sort_order: number
}

const STATUSES = [
  { value: "in_house", label: "In the house" },
  { value: "evicted", label: "Evicted" },
  { value: "walked", label: "Left the house" },
  { value: "disqualified", label: "Disqualified" },
  { value: "winner", label: "Winner" },
]
// Distinct, legible defaults for new housemates; any colour can be picked instead.
const PALETTE = ["#0066FF", "#A855F7", "#F0EBE1", "#22C55E", "#F97316", "#EC4899", "#14B8A6", "#EAB308", "#EF4444", "#6366F1", "#84CC16", "#06B6D4"]

// ---------------------------------------------------------------------
// Seasons for a show
// ---------------------------------------------------------------------
function SeasonsCard({
  db,
  showId,
  seasons,
  selectedId,
  onSelect,
  reload,
}: {
  db: SupabaseClient
  showId: string
  seasons: SeasonRow[]
  selectedId: string
  onSelect: (id: string) => void
  reload: () => Promise<void>
}) {
  const { ok, fail, clear, node } = useNotice()
  const [name, setName] = useState("")
  const [startsOn, setStartsOn] = useState("")
  const [makeCurrent, setMakeCurrent] = useState(true)

  async function setCurrent(seasonId: string) {
    // Only one current season per show: clear the old one first.
    const { error: e1 } = await db.from("seasons").update({ is_current: false }).eq("show_id", showId).eq("is_current", true)
    if (e1) return fail("Couldn't change the current season.", e1)
    const { error: e2 } = await db.from("seasons").update({ is_current: true }).eq("id", seasonId)
    if (e2) return fail("Couldn't change the current season.", e2)
    ok("Current season updated. The show page now shows it.")
    await reload()
  }

  async function create() {
    clear()
    if (!name.trim()) return fail("Give the season a name, for example “Season 10”.")
    if (makeCurrent) {
      const { error } = await db.from("seasons").update({ is_current: false }).eq("show_id", showId).eq("is_current", true)
      if (error) return fail("Couldn't create the season.", error)
    }
    const { data, error } = await db
      .from("seasons")
      .insert({ show_id: showId, name: name.trim(), starts_on: startsOn || null, is_current: makeCurrent })
      .select("id")
      .single()
    if (error || !data) return fail("Couldn't create the season.", error)
    ok(`${name.trim()} created.`)
    setName("")
    setStartsOn("")
    await reload()
    onSelect(data.id)
  }

  async function remove(season: SeasonRow) {
    if (!window.confirm(`Delete ${season.name}? Its housemates, rankings and poll links are deleted too. This can't be undone.`)) return
    const { error } = await db.from("seasons").delete().eq("id", season.id)
    if (error) return fail("Couldn't delete the season.", error)
    ok("Season deleted.")
    await reload()
  }

  return (
    <Card>
      <h2 className="font-heading text-xl font-bold text-contrast">Seasons</h2>
      <p className="mt-1 text-sm text-contrast/70">The current season&apos;s housemates and rankings appear on the show page.</p>
      {seasons.length > 0 && (
        <ul className="mt-4 divide-y divide-contrast/10">
          {seasons.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-contrast">
                  {s.name}
                  {s.is_current && <span className="ml-2 rounded-md bg-accent/20 px-2 py-0.5 text-xs text-contrast">Current</span>}
                </p>
                <p className="text-xs text-contrast/60">
                  {s.starts_on ? `From ${s.starts_on}` : "No start date"}
                  {s.ends_on && ` to ${s.ends_on}`}
                  {s.winner_name && ` · Winner: ${s.winner_name}`}
                  {s.is_sample && " · Sample"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant={s.id === selectedId ? "primary" : "secondary"} onClick={() => onSelect(s.id)} aria-label={`Manage ${s.name}`} aria-pressed={s.id === selectedId}>
                  {s.id === selectedId ? "Managing" : "Manage"}
                </Button>
                {!s.is_current && (
                  <Button variant="secondary" onClick={() => setCurrent(s.id)} aria-label={`Make ${s.name} the current season`}>
                    Make current
                  </Button>
                )}
                <Button variant="danger" onClick={() => remove(s)} aria-label={`Delete ${s.name}`}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_12rem]">
        <Field label="New season name">{(id) => <TextInput id={id} value={name} maxLength={80} placeholder="Season 10" onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Start date (optional)">{(id) => <TextInput id={id} type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />}</Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-contrast">
        <input type="checkbox" checked={makeCurrent} onChange={(e) => setMakeCurrent(e.target.checked)} className="h-4 w-4 accent-[#0066FF]" />
        Make this the current season
      </label>
      <Button className="mt-4" onClick={create}>
        Create season
      </Button>
      <div className="mt-3">{node}</div>
    </Card>
  )
}

// ---------------------------------------------------------------------
// Season details (dates and winner)
// ---------------------------------------------------------------------
function SeasonDetails({ db, season, reload }: { db: SupabaseClient; season: SeasonRow; reload: () => Promise<void> }) {
  const { ok, fail, node } = useNotice()
  const [name, setName] = useState(season.name)
  const [startsOn, setStartsOn] = useState(season.starts_on ?? "")
  const [endsOn, setEndsOn] = useState(season.ends_on ?? "")
  const [winner, setWinner] = useState(season.winner_name ?? "")
  async function save() {
    if (!name.trim()) return fail("The season needs a name.")
    if (startsOn && endsOn && endsOn < startsOn) return fail("The end date is before the start date.")
    const { error } = await db
      .from("seasons")
      .update({ name: name.trim(), starts_on: startsOn || null, ends_on: endsOn || null, winner_name: winner.trim() || null })
      .eq("id", season.id)
    if (error) return fail("Couldn't save the season.", error)
    ok("Season saved.")
    await reload()
  }
  return (
    <Card>
      <h2 className="font-heading text-xl font-bold text-contrast">{season.name}: details</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Name">{(id) => <TextInput id={id} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Winner" hint="Shown on the show page between seasons.">
          {(id) => <TextInput id={id} value={winner} maxLength={80} onChange={(e) => setWinner(e.target.value)} />}
        </Field>
        <Field label="Start date">{(id) => <TextInput id={id} type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />}</Field>
        <Field label="End date">{(id) => <TextInput id={id} type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />}</Field>
      </div>
      <Button className="mt-5" onClick={save}>
        Save details
      </Button>
      <div className="mt-3">{node}</div>
    </Card>
  )
}

// ---------------------------------------------------------------------
// Housemates
// ---------------------------------------------------------------------
function HousemateRowEditor({ db, h, onChanged }: { db: SupabaseClient; h: HousemateRow; onChanged: () => void }) {
  const { ok, fail, node } = useNotice()
  const [name, setName] = useState(h.name)
  const [color, setColor] = useState(h.color ?? "#3D85FF")
  const [status, setStatus] = useState(h.status)
  const [exitWeek, setExitWeek] = useState(h.exit_week ? String(h.exit_week) : "")
  const leaving = status === "evicted" || status === "walked" || status === "disqualified"
  async function save() {
    if (!name.trim()) return fail("A housemate needs a name.")
    const week = leaving && exitWeek ? Number(exitWeek) : null
    if (week !== null && (!Number.isInteger(week) || week < 1)) return fail("The exit week must be a whole number, 1 or more.")
    const { error } = await db.from("housemates").update({ name: name.trim(), color, status, exit_week: week }).eq("id", h.id)
    if (error) return fail("Couldn't save.", error)
    ok("Saved.")
    onChanged()
  }
  const [uploading, setUploading] = useState(false)
  const BUCKET = "housemates"
  const pathOf = (url: string | null) => (url ? url.split(`/object/public/${BUCKET}/`)[1] : undefined)

  async function uploadImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) return fail("Choose an image file.")
    if (file.size > 15 * 1024 * 1024) return fail("That image is over 15 MB. Choose a smaller one.")
    setUploading(true)
    try {
      const blob = await toSquareJpeg(file)
      const path = `${h.id}/${Date.now()}.jpg`
      const { error: upError } = await db.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" })
      if (upError) throw upError
      const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      const { error } = await db.from("housemates").update({ image_url: url }).eq("id", h.id)
      if (error) throw error
      const old = pathOf(h.image_url)
      if (old) await db.storage.from(BUCKET).remove([old]) // tidy up the replaced image
      ok("Image saved.")
      onChanged()
    } catch (e) {
      fail("Couldn't upload the image.", e as { message?: string })
    } finally {
      setUploading(false)
    }
  }

  async function removeImage() {
    const { error } = await db.from("housemates").update({ image_url: null }).eq("id", h.id)
    if (error) return fail("Couldn't remove the image.", error)
    const old = pathOf(h.image_url)
    if (old) await db.storage.from(BUCKET).remove([old])
    ok("Image removed. Initials are shown instead.")
    onChanged()
  }

  async function remove() {
    if (!window.confirm(`Remove ${h.name}? Their rankings are removed too.`)) return
    const { error } = await db.from("housemates").delete().eq("id", h.id)
    if (error) return fail("Couldn't remove.", error)
    onChanged()
  }
  return (
    <li className="py-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_4rem_11rem_6rem_auto_auto] sm:items-end">
        <Field label="Name">{(id) => <TextInput id={id} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Colour">
          {(id) => <input id={id} type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-contrast/20 bg-base p-1" />}
        </Field>
        <Field label="Status">
          {(id) => (
            <Select id={id} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Exit week">
          {(id) => <TextInput id={id} type="number" min={1} inputMode="numeric" disabled={!leaving} value={leaving ? exitWeek : ""} onChange={(e) => setExitWeek(e.target.value)} />}
        </Field>
        <Button onClick={save} aria-label={`Save ${h.name}`}>
          Save
        </Button>
        <Button variant="danger" onClick={remove} aria-label={`Remove ${h.name}`}>
          Remove
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <HousemateAvatar name={h.name} color={color} imageUrl={h.image_url} />
        <label className={`cursor-pointer rounded-lg border border-contrast/20 px-4 py-2 text-sm font-medium text-contrast hover:border-contrast/40 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${uploading ? "opacity-50" : ""}`}>
          {uploading ? "Uploading..." : h.image_url ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            aria-label={`${h.image_url ? "Replace" : "Upload"} image for ${h.name}`}
            onChange={(e) => {
              uploadImage(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </label>
        {h.image_url && (
          <Button variant="secondary" onClick={removeImage} aria-label={`Remove image for ${h.name}`}>
            Remove image
          </Button>
        )}
      </div>
      {node}
    </li>
  )
}

function HousematesCard({ db, seasonId, housemates, reload }: { db: SupabaseClient; seasonId: string; housemates: HousemateRow[]; reload: () => void }) {
  const { ok, fail, clear, node } = useNotice()
  const [names, setNames] = useState("")
  async function add() {
    clear()
    // One name per line, so a whole launch-night line-up can be added at once.
    const list = names.split("\n").map((n) => n.trim()).filter(Boolean)
    if (list.length === 0) return fail("Type at least one name.")
    const start = housemates.reduce((max, h) => Math.max(max, h.sort_order), 0)
    const { error } = await db.from("housemates").insert(
      list.map((name, i) => ({ season_id: seasonId, name: name.slice(0, 60), color: PALETTE[(housemates.length + i) % PALETTE.length], sort_order: start + i + 1 })),
    )
    if (error) return fail("Couldn't add housemates.", error)
    ok(list.length === 1 ? `${list[0]} added.` : `${list.length} housemates added.`)
    setNames("")
    reload()
  }
  return (
    <Card>
      <h2 className="font-heading text-xl font-bold text-contrast">Housemates</h2>
      <p className="mt-1 text-sm text-contrast/70">Update status and exit week after each eviction. Images are optional and resized automatically; without one, coloured initials are shown. Only upload images you have the right to use.</p>
      {housemates.length > 0 && (
        <ul className="mt-2 divide-y divide-contrast/10">
          {housemates.map((h) => (
            <HousemateRowEditor key={`${h.id}-${h.name}-${h.status}-${h.exit_week}-${h.color}-${h.image_url}`} db={db} h={h} onChanged={reload} />
          ))}
        </ul>
      )}
      <div className="mt-5">
        <Field label="Add housemates" hint="One name per line.">
          {(id) => <textarea id={id} rows={3} value={names} onChange={(e) => setNames(e.target.value)} className="w-full rounded-lg border border-contrast/20 bg-base px-3 py-2 text-sm text-contrast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" />}
        </Field>
        <Button className="mt-3" onClick={add}>
          Add
        </Button>
      </div>
      <div className="mt-3">{node}</div>
    </Card>
  )
}

// ---------------------------------------------------------------------
// Rankings: categories and the weekly grid
// ---------------------------------------------------------------------
function RankingsCard({ db, seasonId, housemates, categories, reloadCategories }: { db: SupabaseClient; seasonId: string; housemates: HousemateRow[]; categories: CategoryRow[]; reloadCategories: () => void }) {
  const { ok, fail, clear, node } = useNotice()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [newName, setNewName] = useState("")
  const [newHigher, setNewHigher] = useState(true)
  const [busy, setBusy] = useState(false)
  const key = (c: string, h: string) => `${c}:${h}`

  const loadStats = useCallback(async () => {
    if (categories.length === 0) return
    const { data, error } = await db
      .from("housemate_stats")
      .select("category_id, housemate_id, value")
      .in("category_id", categories.map((c) => c.id))
    if (error) return fail("Couldn't load rankings.", error)
    const map: Record<string, string> = {}
    for (const row of data ?? []) map[key(row.category_id, row.housemate_id)] = String(row.value)
    setValues(map)
    setSaved(map)
  }, [db, categories, fail])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const changed = useMemo(() => Object.keys(values).filter((k) => (values[k] ?? "") !== (saved[k] ?? "")), [values, saved])

  async function saveGrid() {
    clear()
    const rows = []
    for (const k of changed) {
      const [category_id, housemate_id] = k.split(":")
      const raw = values[k].trim()
      const value = raw === "" ? 0 : Number(raw)
      if (!Number.isInteger(value) || value < 0) return fail("Rankings must be whole numbers, 0 or more.")
      rows.push({ category_id, housemate_id, value })
    }
    if (rows.length === 0) return ok("No changes to save.")
    setBusy(true)
    const { error } = await db.from("housemate_stats").upsert(rows, { onConflict: "category_id,housemate_id" })
    setBusy(false)
    if (error) return fail("Couldn't save the rankings.", error)
    ok(`Rankings saved (${rows.length} ${rows.length === 1 ? "change" : "changes"}). The show page updates within a minute.`)
    loadStats()
  }

  async function addCategory() {
    clear()
    if (!newName.trim()) return fail("Name the category, for example “Most tasks won”.")
    const order = categories.reduce((m, c) => Math.max(m, c.sort_order), 0) + 1
    const { error } = await db.from("ranking_categories").insert({ season_id: seasonId, name: newName.trim(), higher_is_better: newHigher, sort_order: order })
    if (error) return fail("Couldn't add the category.", error)
    ok("Category added.")
    setNewName("")
    setNewHigher(true)
    reloadCategories()
  }

  async function removeCategory(c: CategoryRow) {
    if (!window.confirm(`Delete the “${c.name}” ranking and its numbers?`)) return
    const { error } = await db.from("ranking_categories").delete().eq("id", c.id)
    if (error) return fail("Couldn't delete the category.", error)
    ok("Category deleted.")
    reloadCategories()
  }

  return (
    <Card>
      <h2 className="font-heading text-xl font-bold text-contrast">Rankings</h2>
      <p className="mt-1 text-sm text-contrast/70">Running totals for the season. Update the numbers after each week, then save once.</p>

      {categories.length > 0 && housemates.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <caption className="sr-only">Ranking numbers by housemate and category</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 bg-[#191818] px-3 py-2 text-left font-medium text-contrast/70">
                  Housemate
                </th>
                {categories.map((c) => (
                  <th key={c.id} scope="col" className="min-w-[8rem] px-3 py-2 text-left font-medium text-contrast">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {housemates.map((h) => (
                <tr key={h.id} className="border-t border-contrast/10">
                  <th scope="row" className="sticky left-0 bg-[#191818] px-3 py-2 text-left font-normal text-contrast">
                    {h.name}
                  </th>
                  {categories.map((c) => {
                    const k = key(c.id, h.id)
                    const dirty = (values[k] ?? "") !== (saved[k] ?? "")
                    return (
                      <td key={c.id} className="px-3 py-1.5">
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          aria-label={`${h.name}: ${c.name}`}
                          value={values[k] ?? ""}
                          placeholder="0"
                          onChange={(e) => setValues({ ...values, [k]: e.target.value })}
                          className={`w-20 rounded-lg border bg-base px-2 py-1.5 text-contrast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${dirty ? "border-accent" : "border-contrast/20"}`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-contrast/70">Add housemates and at least one category to start ranking.</p>
      )}

      {categories.length > 0 && housemates.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={saveGrid} disabled={busy}>
            Save rankings{changed.length > 0 ? ` (${changed.length})` : ""}
          </Button>
          <span className="text-xs text-contrast/60">Changed cells are outlined in blue.</span>
        </div>
      )}

      <div className="mt-6 border-t border-contrast/10 pt-5">
        <h3 className="font-heading text-lg font-bold text-contrast">Categories</h3>
        {categories.length > 0 && (
          <ul className="mt-2 divide-y divide-contrast/10">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-contrast">
                  {c.name}
                  <span className="ml-2 text-xs text-contrast/60">{c.higher_is_better ? "Highest ranks first" : "Lowest ranks first"}</span>
                </span>
                <Button variant="danger" onClick={() => removeCategory(c)} aria-label={`Delete the ${c.name} ranking`}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="New category" hint="For example, “Most tasks won” or “Most nominations received”.">
            {(id) => <TextInput id={id} value={newName} maxLength={60} onChange={(e) => setNewName(e.target.value)} />}
          </Field>
          <Button onClick={addCategory}>Add category</Button>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-contrast">
          <input type="checkbox" checked={newHigher} onChange={(e) => setNewHigher(e.target.checked)} className="h-4 w-4 accent-[#0066FF]" />
          Highest number ranks first (untick for “fewest” rankings)
        </label>
      </div>
      <div className="mt-3">{node}</div>
    </Card>
  )
}

// ---------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------
export default function SeasonsPanel({ db }: { db: SupabaseClient }) {
  const { shows } = useShows(db)
  const { fail, node } = useNotice()
  const [showId, setShowId] = useState("")
  const [seasons, setSeasons] = useState<SeasonRow[]>([])
  const [seasonId, setSeasonId] = useState("")
  const [housemates, setHousemates] = useState<HousemateRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])

  useEffect(() => {
    if (!showId && shows[0]) setShowId(shows[0].id)
  }, [shows, showId])

  const loadSeasons = useCallback(async () => {
    if (!showId) return
    const { data, error } = await db
      .from("seasons")
      .select("id, name, starts_on, ends_on, is_current, winner_name, is_sample")
      .eq("show_id", showId)
      .order("created_at", { ascending: false })
    if (error) return fail("Couldn't load seasons.", error)
    const rows = (data ?? []) as SeasonRow[]
    setSeasons(rows)
    setSeasonId((current) => (rows.some((s) => s.id === current) ? current : (rows.find((s) => s.is_current)?.id ?? rows[0]?.id ?? "")))
  }, [db, showId, fail])

  const loadHousemates = useCallback(async () => {
    if (!seasonId) return setHousemates([])
    const { data } = await db.from("housemates").select("id, name, color, image_url, status, exit_week, sort_order").eq("season_id", seasonId).order("sort_order")
    setHousemates((data ?? []) as HousemateRow[])
  }, [db, seasonId])

  const loadCategories = useCallback(async () => {
    if (!seasonId) return setCategories([])
    const { data } = await db.from("ranking_categories").select("id, name, description, higher_is_better, sort_order").eq("season_id", seasonId).order("sort_order")
    setCategories((data ?? []) as CategoryRow[])
  }, [db, seasonId])

  useEffect(() => {
    loadSeasons()
  }, [loadSeasons])
  useEffect(() => {
    loadHousemates()
    loadCategories()
  }, [loadHousemates, loadCategories])

  const season = seasons.find((s) => s.id === seasonId)

  return (
    <div className="space-y-6">
      <Card>
        <Field label="Show">
          {(id) => (
            <Select
              id={id}
              value={showId}
              onChange={(e) => {
                setShowId(e.target.value)
                setSeasonId("")
              }}
            >
              {shows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {node}
      </Card>
      {showId && <SeasonsCard db={db} showId={showId} seasons={seasons} selectedId={seasonId} onSelect={setSeasonId} reload={loadSeasons} />}
      {season && (
        <>
          <SeasonDetails key={`${season.id}-${season.name}-${season.winner_name}-${season.starts_on}-${season.ends_on}`} db={db} season={season} reload={loadSeasons} />
          <HousematesCard db={db} seasonId={season.id} housemates={housemates} reload={loadHousemates} />
          <RankingsCard db={db} seasonId={season.id} housemates={housemates} categories={categories} reloadCategories={loadCategories} />
        </>
      )}
    </div>
  )
}
