"use client"

import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button, Card, Field, Select, TextInput, formatDate, toCoverJpeg, useNotice, useShows, type EditorShow } from "./fields"

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

const VENUES = [
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
]

function ShowRow({ db, show, onSaved }: { db: SupabaseClient; show: EditorShow; onSaved: () => void }) {
  const { ok, fail, node } = useNotice()
  const [status, setStatus] = useState(show.status)
  const [tagline, setTagline] = useState(show.tagline ?? "")
  const [singular, setSingular] = useState(show.cast_singular)
  const [plural, setPlural] = useState(show.cast_plural)
  const [venue, setVenue] = useState(show.venue)
  const [country, setCountry] = useState(show.country ?? "")
  const [accent, setAccent] = useState(show.accent_color ?? "#0066FF")
  const [uploading, setUploading] = useState(false)
  const BUCKET = "post-images"
  const pathOf = (url: string | null) => (url ? url.split(`/object/public/${BUCKET}/`)[1] : undefined)

  async function uploadImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) return fail("Choose an image file.")
    if (file.size > 20 * 1024 * 1024) return fail("That image is over 20 MB. Choose a smaller one.")
    setUploading(true)
    try {
      const blob = await toCoverJpeg(file, 1200, 630)
      const path = `shows/${show.id}/${Date.now()}.jpg`
      const { error: upError } = await db.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" })
      if (upError) throw upError
      const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      const { error } = await db.from("shows").update({ image_url: url }).eq("id", show.id)
      if (error) throw error
      const old = pathOf(show.image_url)
      if (old) await db.storage.from(BUCKET).remove([old]) // tidy up the replaced image
      ok("Image saved. It appears on the site within a minute.")
      onSaved()
    } catch (e) {
      fail("Couldn't upload the image.", e as { message?: string })
    } finally {
      setUploading(false)
    }
  }

  async function removeImage() {
    const { error } = await db.from("shows").update({ image_url: null }).eq("id", show.id)
    if (error) return fail("Couldn't remove the image.", error)
    const old = pathOf(show.image_url)
    if (old) await db.storage.from(BUCKET).remove([old])
    ok("Image removed.")
    onSaved()
  }

  async function setActive(active: boolean) {
    if (!active && !window.confirm(`Hide ${show.name} from the site? Its card, page and news disappear for visitors until you switch it back on. Nothing is deleted.`)) return
    const { error } = await db.from("shows").update({ is_active: active }).eq("id", show.id)
    if (error) return fail("Couldn't change the show.", error)
    ok(active ? `${show.name} is back on the site.` : `${show.name} is hidden from the site.`)
    onSaved()
  }

  async function save() {
    if (!singular.trim() || !plural.trim()) return fail("Fill in both cast words.")
    const { error } = await db
      .from("shows")
      .update({ status, tagline: tagline.trim() || null, cast_singular: singular.trim(), cast_plural: plural.trim(), venue, country: country.trim() || null, accent_color: accent })
      .eq("id", show.id)
    if (error) return fail("Couldn't save.", error)
    ok("Saved.")
    onSaved()
  }
  return (
    <li className={`space-y-3 py-4 ${show.is_active ? "" : "opacity-80"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium text-contrast">
          {show.name}
          {!show.is_active && <span className="ml-2 rounded-md bg-contrast/10 px-2 py-0.5 text-xs font-normal text-contrast/80">Hidden from the site</span>}
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-contrast">
          <input
            type="checkbox"
            role="switch"
            aria-checked={show.is_active}
            checked={show.is_active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-[#0066FF]"
          />
          Active on the site
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-[14rem_1fr]">
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
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_5rem]">
        <Field label="Country">{(id) => <TextInput id={id} value={country} maxLength={40} placeholder="Nigeria" onChange={(e) => setCountry(e.target.value)} />}</Field>
        <Field label="Colour">
          {(id) => <input id={id} type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-contrast/20 bg-base p-1" />}
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-end">
        <Field label="One cast member is a">{(id) => <TextInput id={id} value={singular} maxLength={20} placeholder="Housemate" onChange={(e) => setSingular(e.target.value)} />}</Field>
        <Field label="The cast are">{(id) => <TextInput id={id} value={plural} maxLength={20} placeholder="Housemates" onChange={(e) => setPlural(e.target.value)} />}</Field>
        <Field label="They live in a">
          {(id) => (
            <Select id={id} value={venue} onChange={(e) => setVenue(e.target.value as "house" | "villa")}>
              {VENUES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Button onClick={save} aria-label={`Save ${show.name}`}>
          Save
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {show.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={show.image_url} alt="" className="aspect-[1200/630] w-40 rounded-lg object-cover" />
        )}
        <label className={`cursor-pointer rounded-lg border border-contrast/20 px-4 py-2 text-sm font-medium text-contrast hover:border-contrast/40 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${uploading ? "opacity-50" : ""}`}>
          {uploading ? "Uploading..." : show.image_url ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            aria-label={`${show.image_url ? "Replace" : "Upload"} image for ${show.name}`}
            onChange={(e) => {
              uploadImage(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </label>
        {show.image_url && (
          <Button variant="secondary" onClick={removeImage} aria-label={`Remove image for ${show.name}`}>
            Remove image
          </Button>
        )}
        <span className="text-xs text-contrast/60">1200 x 630, cropped automatically. Use your own artwork, not the show&apos;s logo or posters.</span>
      </div>
      {node}
    </li>
  )
}

const slugify = (name: string) =>
  name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)

function AddShow({ db, onAdded }: { db: SupabaseClient; onAdded: () => void }) {
  const { ok, fail, clear, node } = useNotice()
  const [name, setName] = useState("")
  const [shortName, setShortName] = useState("")
  const [country, setCountry] = useState("")
  const [venue, setVenue] = useState<"house" | "villa">("house")
  const [accent, setAccent] = useState("#0066FF")
  async function add() {
    clear()
    const slug = slugify(name)
    if (!name.trim() || !slug) return fail("Give the show a name.")
    const villa = venue === "villa"
    const { error } = await db.from("shows").insert({
      slug,
      name: name.trim(),
      short_name: shortName.trim() || null,
      country: country.trim() || null,
      accent_color: accent,
      status: "coming_soon",
      venue,
      cast_singular: villa ? "Islander" : "Housemate",
      cast_plural: villa ? "Islanders" : "Housemates",
      sort_order: 0,
    })
    if (error) return fail(error.code === "23505" ? "A show with that name already exists." : "Couldn't add the show.", error.code === "23505" ? null : error)
    ok(`${name.trim()} added as “Coming soon”. Change its status above when it should get its own page.`)
    setName("")
    setShortName("")
    setCountry("")
    onAdded()
  }
  return (
    <div className="mt-6 border-t border-contrast/10 pt-5">
      <h3 className="font-heading text-lg font-bold text-contrast">Add a show</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Name" hint={name ? `Page address: /fanzone/${slugify(name)}` : "For example, “Big Brother Titans”."}>
          {(id) => <TextInput id={id} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Short name (optional)" hint="Used on small labels, for example “BBNaija”.">
          {(id) => <TextInput id={id} value={shortName} maxLength={20} onChange={(e) => setShortName(e.target.value)} />}
        </Field>
        <Field label="Country (optional)">{(id) => <TextInput id={id} value={country} maxLength={40} onChange={(e) => setCountry(e.target.value)} />}</Field>
        <div className="grid grid-cols-[1fr_5rem] gap-3">
          <Field label="Format">
            {(id) => (
              <Select id={id} value={venue} onChange={(e) => setVenue(e.target.value as "house" | "villa")}>
                <option value="house">House (housemates)</option>
                <option value="villa">Villa (islanders)</option>
              </Select>
            )}
          </Field>
          <Field label="Colour">
            {(id) => <input id={id} type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-contrast/20 bg-base p-1" />}
          </Field>
        </div>
      </div>
      <Button className="mt-4" onClick={add}>
        Add show
      </Button>
      <div className="mt-3">{node}</div>
    </div>
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
        <p className="mt-1 text-sm text-contrast/70">Set each show&apos;s status as seasons start and end, and the words the site uses for its cast.</p>
        <ul className="mt-2 divide-y divide-contrast/10">
          {shows.map((show) => (
            <ShowRow key={`${show.id}-${show.status}-${show.tagline}-${show.cast_plural}-${show.venue}-${show.image_url}-${show.country}-${show.accent_color}-${show.is_active}`} db={db} show={show} onSaved={reload} />
          ))}
        </ul>
        <AddShow db={db} onAdded={reload} />
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
