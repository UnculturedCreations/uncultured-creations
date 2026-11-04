"use client"

import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button, Card, Field, Select, TextInput, formatDate, useNotice, useShows, type EditorShow } from "./fields"

const STATUSES = [
  { value: "live", label: "On air" },
  { value: "upcoming", label: "Starting soon" },
  { value: "off_season", label: "Between seasons" },
  { value: "coming_soon", label: "Coming soon (no show page)" },
]
const EVENT_KINDS = [
  { value: "live_show", label: "Live show" },
  { value: "eviction", label: "Eviction" },
  { value: "premiere", label: "Premiere" },
  { value: "finale", label: "Finale" },
  { value: "other", label: "Other" },
]

interface EventRow {
  id: string
  show_id: string
  title: string
  kind: string
  starts_at: string
  is_sample: boolean
}

function ShowRow({ db, show, onSaved }: { db: SupabaseClient; show: EditorShow; onSaved: () => void }) {
  const { ok, fail, node: noticeNode } = useNotice()
  const [status, setStatus] = useState(show.status)
  const [tagline, setTagline] = useState(show.tagline ?? "")
  async function save() {
    const { error } = await db.from("shows").update({ status, tagline: tagline.trim() || null }).eq("id", show.id)
    if (error) return fail("Couldn't save.", error)
    ok("Saved.")
    onSaved()
  }
  return (
    <li className="space-y-3 py-4">
      <p className="font-medium text-contrast">{show.name}</p>
      <div className="grid gap-3 sm:grid-cols-[14rem_1fr_auto] sm:items-end">
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
        <Field label="Tagline">
          {(id) => <TextInput id={id} value={tagline} maxLength={160} onChange={(e) => setTagline(e.target.value)} />}
        </Field>
        <Button onClick={save} aria-label={`Save ${show.name}`}>
          Save
        </Button>
      </div>
      {noticeNode}
    </li>
  )
}

export default function ShowsPanel({ db }: { db: SupabaseClient }) {
  const { shows, reload } = useShows(db)
  const { ok, fail, clear, node: noticeNode } = useNotice()
  const [events, setEvents] = useState<EventRow[]>([])
  const [showId, setShowId] = useState("")
  const [title, setTitle] = useState("")
  const [kind, setKind] = useState("live_show")
  const [startsAt, setStartsAt] = useState("")

  useEffect(() => {
    if (!showId && shows[0]) setShowId(shows[0].id)
  }, [shows, showId])

  const load = useCallback(async () => {
    const { data, error } = await db
      .from("show_events")
      .select("id, show_id, title, kind, starts_at, is_sample")
      .gte("starts_at", new Date(Date.now() - 86400000).toISOString())
      .order("starts_at")
    if (error) fail("Couldn't load the schedule.", error)
    setEvents((data ?? []) as EventRow[])
  }, [db, fail])

  useEffect(() => {
    load()
  }, [load])

  async function addEvent() {
    clear()
    if (!showId || !title.trim() || !startsAt) return fail("Choose a show, add a title and pick a date and time.")
    // The date picker gives local time; store it as an exact moment so every visitor sees their own time zone.
    const { error } = await db.from("show_events").insert({ show_id: showId, title: title.trim(), kind, starts_at: new Date(startsAt).toISOString() })
    if (error) return fail("Couldn't add the event.", error)
    ok("Event added. The countdown appears within a minute.")
    setTitle("")
    setStartsAt("")
    load()
  }

  async function removeEvent(event: EventRow) {
    if (!window.confirm(`Remove "${event.title}" from the schedule?`)) return
    const { error } = await db.from("show_events").delete().eq("id", event.id)
    if (error) return fail("Couldn't remove the event.", error)
    ok("Event removed.")
    load()
  }

  const showName = (id: string) => shows.find((s) => s.id === id)?.short_name ?? shows.find((s) => s.id === id)?.name ?? ""

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">Shows</h2>
        <p className="mt-1 text-sm text-contrast/70">Set each show&apos;s status as seasons start and end.</p>
        <ul className="mt-2 divide-y divide-contrast/10">
          {shows.map((show) => (
            <ShowRow key={`${show.id}-${show.status}-${show.tagline}`} db={db} show={show} onSaved={reload} />
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">Schedule</h2>
        <p className="mt-1 text-sm text-contrast/70">The next upcoming event for each show drives its countdown. Times are entered in your local time zone.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Show">
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
          <Field label="Type">
            {(id) => (
              <Select id={id} value={kind} onChange={(e) => setKind(e.target.value)}>
                {EVENT_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Title" hint="For example, “Sunday eviction show”.">
            {(id) => <TextInput id={id} value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />}
          </Field>
          <Field label="Date and time">
            {(id) => <TextInput id={id} type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />}
          </Field>
        </div>
        <Button className="mt-5" onClick={addEvent}>
          Add event
        </Button>
        <div className="mt-3">{noticeNode}</div>

        {events.length > 0 && (
          <ul className="mt-4 divide-y divide-contrast/10">
            {events.map((event) => (
              <li key={event.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-contrast">{event.title}</p>
                  <p className="text-xs text-contrast/60">
                    {formatDate(event.starts_at)} · {showName(event.show_id)} · {EVENT_KINDS.find((k) => k.value === event.kind)?.label}
                    {event.is_sample && " · Sample"}
                  </p>
                </div>
                <Button variant="danger" onClick={() => removeEvent(event)} aria-label={`Remove ${event.title}`}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
