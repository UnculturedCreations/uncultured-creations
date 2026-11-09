"use client"

import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { FAN_FICTION_RULES, genreLabel, noteLabel } from "@/app/components/fanzone/fanFiction"
import FanStoryCover from "@/app/components/fanzone/FanStoryCover"
import { Button, Card, Field, Select, TextInput, formatDate, toCoverJpeg, useNotice, useShows } from "./fields"
import DeclineBox from "./DeclineBox"

type Status = "pending" | "approved" | "declined"

interface StoryRow {
  id: string
  slug: string
  show_id: string | null
  title: string
  pen_name: string
  blurb: string | null
  body: string
  status: Status
  published_at: string | null
  created_at: string
  genres: string[]
  content_notes: string[]
  cover_url: string | null
  featured: boolean
  prompt: { title: string } | null
  author: { display_name: string | null } | null
  chapter_count: number
}

interface PromptRow {
  id: string
  show_id: string | null
  title: string
  prompt: string
  status: "draft" | "active" | "closed"
}

const COVERS = "fan-covers"
const coverPath = (url: string | null) => (url ? url.split(`/object/public/${COVERS}/`)[1] : undefined)

// Weekly writing prompts: create, close, reopen, delete.
function PromptsCard({ db, userId }: { db: SupabaseClient; userId: string }) {
  const { shows } = useShows(db)
  const { ok, fail, clear, node } = useNotice()
  const [prompts, setPrompts] = useState<PromptRow[]>([])
  const [showId, setShowId] = useState("")
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")

  const load = useCallback(async () => {
    const { data, error } = await db.from("writing_prompts").select("id, show_id, title, prompt, status").order("created_at", { ascending: false }).limit(30)
    if (error) fail("Couldn't load prompts.", error)
    setPrompts((data ?? []) as PromptRow[])
  }, [db, fail])
  useEffect(() => {
    load()
  }, [load])

  async function create() {
    clear()
    if (!title.trim() || !text.trim()) return fail("Give the prompt a title and the prompt itself.")
    const { error } = await db.from("writing_prompts").insert({ show_id: showId || null, title: title.trim(), prompt: text.trim(), status: "active", created_by: userId })
    if (error) return fail("Couldn't create the prompt.", error)
    ok("Prompt is live. It appears on the fan fiction pages within a minute.")
    setTitle("")
    setText("")
    load()
  }
  async function setStatus(p: PromptRow, status: PromptRow["status"]) {
    const { error } = await db.from("writing_prompts").update({ status }).eq("id", p.id)
    if (error) return fail("Couldn't update the prompt.", error)
    ok(status === "active" ? "Prompt reopened." : "Prompt closed. Stories already written for it keep their label.")
    load()
  }
  async function remove(p: PromptRow) {
    if (!window.confirm(`Delete the prompt "${p.title}"? Stories written for it stay, without the label.`)) return
    const { error } = await db.from("writing_prompts").delete().eq("id", p.id)
    if (error) return fail("Couldn't delete the prompt.", error)
    ok("Prompt deleted.")
    load()
  }
  const showName = (id: string | null) => (id ? (shows.find((s) => s.id === id)?.short_name ?? shows.find((s) => s.id === id)?.name ?? "") : "All shows")

  return (
    <Card>
      <h2 className="font-heading text-xl font-bold text-contrast">Writing prompts</h2>
      <p className="mt-1 text-sm text-contrast/70">A weekly prompt gives fans an easy way in. Close it when the week moves on.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[14rem_1fr]">
        <Field label="Show">
          {(id) => (
            <Select id={id} value={showId} onChange={(e) => setShowId(e.target.value)}>
              <option value="">All shows</option>
              {shows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Prompt title">{(id) => <TextInput id={id} value={title} maxLength={100} placeholder="The evicted speak" onChange={(e) => setTitle(e.target.value)} />}</Field>
        <div className="sm:col-span-2">
          <Field label="The prompt">
            {(id) => <TextInput id={id} value={text} maxLength={500} placeholder="Write eviction night from the evicted housemate's point of view." onChange={(e) => setText(e.target.value)} />}
          </Field>
        </div>
      </div>
      <Button className="mt-4" onClick={create}>
        Publish prompt
      </Button>
      <div className="mt-3">{node}</div>
      {prompts.length > 0 && (
        <ul className="mt-3 divide-y divide-contrast/10">
          {prompts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-contrast">{p.title}</p>
                <p className="text-xs text-contrast/60">
                  {p.status === "active" ? "Live" : p.status === "closed" ? "Closed" : "Draft"} · {showName(p.show_id)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.status === "active" ? (
                  <Button variant="secondary" onClick={() => setStatus(p, "closed")} aria-label={`Close prompt ${p.title}`}>Close</Button>
                ) : (
                  <Button variant="secondary" onClick={() => setStatus(p, "active")} aria-label={`Reopen prompt ${p.title}`}>Reopen</Button>
                )}
                <Button variant="danger" onClick={() => remove(p)} aria-label={`Delete prompt ${p.title}`}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

const FILTERS: { id: Status; label: string }[] = [
  { id: "pending", label: "Waiting for review" },
  { id: "approved", label: "Published" },
  { id: "declined", label: "Declined" },
]

interface ChapterRow {
  id: string
  story_id: string
  number: number
  title: string | null
  body: string
  status: "pending" | "approved" | "declined"
  published_at: string | null
  created_at: string
  story: { title: string; slug: string; pen_name: string } | null
}

// New chapters for published stories: read, then approve or decline.
function ChaptersCard({ db, userId }: { db: SupabaseClient; userId: string }) {
  const { ok, fail, node } = useNotice()
  const [chapters, setChapters] = useState<ChapterRow[] | null>(null)
  const load = useCallback(async () => {
    const { data, error } = await db
      .from("story_chapters")
      .select("id, story_id, number, title, body, status, published_at, created_at, story:fan_stories(title, slug, pen_name)")
      .eq("status", "pending")
      .order("created_at")
    if (error) fail("Couldn't load chapters.", error)
    setChapters((data ?? []) as unknown as ChapterRow[])
  }, [db, fail])
  useEffect(() => {
    load()
  }, [load])
  const [declining, setDeclining] = useState<string | null>(null)
  async function decide(c: ChapterRow, approve: boolean) {
    const { error } = await db
      .from("story_chapters")
      .update({ status: approve ? "approved" : "declined", published_at: approve ? new Date().toISOString() : null, reviewed_by: userId })
      .eq("id", c.id)
    if (error) return fail("Couldn't update the chapter.", error)
    ok(approve ? `Chapter ${c.number} of "${c.story?.title}" published.` : `Chapter ${c.number} declined. The writer can fix and resubmit it.`)
    load()
  }
  if (!chapters || chapters.length === 0) return null
  return (
    <Card>
      <h2 className="font-heading text-xl font-bold text-contrast">Chapters waiting for review ({chapters.length})</h2>
      <div className="mt-3">{node}</div>
      <ul className="mt-2 space-y-4">
        {chapters.map((c) => (
          <li key={c.id} className="rounded-xl border border-contrast/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-contrast">
                  {c.story?.title}: chapter {c.number}
                  {c.title ? ` (${c.title})` : ""}
                </p>
                <p className="text-xs text-contrast/60">
                  by {c.story?.pen_name} · sent {formatDate(c.created_at)} · {c.body.length.toLocaleString()} characters
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => decide(c, true)} aria-label={`Approve chapter ${c.number} of ${c.story?.title}`}>Approve</Button>
                <Button variant="secondary" onClick={() => setDeclining(declining === c.id ? null : c.id)} aria-expanded={declining === c.id} aria-label={`Decline chapter ${c.number} of ${c.story?.title}`}>Decline</Button>
              </div>
            </div>
            {declining === c.id && (
              <DeclineBox
                db={db}
                userId={userId}
                storyId={c.story_id}
                chapterId={c.id}
                onCancel={() => setDeclining(null)}
                onDone={(error) => {
                  if (error) return fail("Couldn't decline the chapter.", error)
                  ok(`Chapter ${c.number} declined. The writer has been notified with your note.`)
                  setDeclining(null)
                  load()
                }}
              />
            )}
            <details className="mt-3" open>
              <summary className="cursor-pointer text-sm font-medium text-contrast/80 hover:text-contrast">Read the chapter</summary>
              <div className="mt-3 max-h-[24rem] space-y-3 overflow-y-auto rounded-xl border border-contrast/10 p-4 text-sm leading-relaxed text-contrast/90">
                {c.body.split(/\n\s*\n/).map((p, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {p.trim()}
                  </p>
                ))}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function FanFictionPanel({ db, userId, isAdmin }: { db: SupabaseClient; userId: string; isAdmin: boolean }) {
  const { shows } = useShows(db)
  const { ok, fail, node } = useNotice()
  const [filter, setFilter] = useState<Status>("pending")
  const [stories, setStories] = useState<StoryRow[]>([])
  const [counts, setCounts] = useState<Record<Status, number>>({ pending: 0, approved: 0, declined: 0 })
  const [emails, setEmails] = useState<Record<string, string>>({})
  const [declining, setDeclining] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await db
      .from("fan_stories")
      .select("id, slug, show_id, title, pen_name, blurb, body, status, published_at, created_at, genres, content_notes, cover_url, featured, chapter_count, prompt:writing_prompts(title), author:profiles!fan_stories_author_id_fkey(display_name)")
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) fail("Couldn't load stories.", error)
    const rows = (data ?? []) as unknown as StoryRow[]
    setStories(rows)
    setCounts({
      pending: rows.filter((r) => r.status === "pending").length,
      approved: rows.filter((r) => r.status === "approved").length,
      declined: rows.filter((r) => r.status === "declined").length,
    })
    if (isAdmin) {
      // Contact emails are readable by admins only (the database enforces this too).
      const { data: contacts } = await db.from("fan_story_contacts").select("story_id, email")
      setEmails(Object.fromEntries((contacts ?? []).map((c) => [c.story_id, c.email])))
    }
  }, [db, fail, isAdmin])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(story: StoryRow, status: Status) {
    const { error } = await db
      .from("fan_stories")
      .update({
        status,
        published_at: status === "approved" ? (story.published_at ?? new Date().toISOString()) : null,
        reviewed_by: userId,
      })
      .eq("id", story.id)
    if (error) return fail("Couldn't update the story.", error)
    ok(status === "approved" ? `"${story.title}" approved. It appears on the site within a minute.` : status === "declined" ? `"${story.title}" declined.` : `"${story.title}" moved back to review.`)
    load()
  }

  async function remove(story: StoryRow) {
    if (!window.confirm(`Delete "${story.title}" permanently? This also deletes the writer's email, if they gave one.`)) return
    const { error } = await db.from("fan_stories").delete().eq("id", story.id)
    if (error) return fail("Couldn't delete the story.", error)
    const path = coverPath(story.cover_url)
    if (path) await db.storage.from(COVERS).remove([path])
    ok("Story deleted.")
    load()
  }

  async function toggleFeatured(story: StoryRow) {
    const { error } = await db.from("fan_stories").update({ featured: !story.featured }).eq("id", story.id)
    if (error) return fail("Couldn't update the story.", error)
    ok(story.featured ? "Removed from editor's picks." : "Added to editor's picks. It's highlighted on the Reality Reloaded home.")
    load()
  }

  async function removeCover(story: StoryRow) {
    const { error } = await db.from("fan_stories").update({ cover_url: null }).eq("id", story.id)
    if (error) return fail("Couldn't remove the cover.", error)
    const path = coverPath(story.cover_url)
    if (path) await db.storage.from(COVERS).remove([path])
    ok("Cover removed. The automatic cover is used instead.")
    load()
  }

  async function replaceCover(story: StoryRow, file: File | undefined) {
    if (!file) return
    try {
      const blob = await toCoverJpeg(file, 600, 900)
      const path = `covers/${crypto.randomUUID()}.jpg`
      const { error: upError } = await db.storage.from(COVERS).upload(path, blob, { contentType: "image/jpeg" })
      if (upError) throw upError
      const url = db.storage.from(COVERS).getPublicUrl(path).data.publicUrl
      const { error } = await db.from("fan_stories").update({ cover_url: url }).eq("id", story.id)
      if (error) throw error
      const old = coverPath(story.cover_url)
      if (old) await db.storage.from(COVERS).remove([old])
      ok("Cover replaced.")
      load()
    } catch (e) {
      fail("Couldn't replace the cover.", e as { message?: string })
    }
  }

  const showName = (id: string | null) => (id ? (shows.find((s) => s.id === id)?.name ?? "") : "No particular show")
  const visible = stories.filter((s) => s.status === filter)

  return (
    <div className="space-y-6">
      <PromptsCard db={db} userId={userId} />
      <ChaptersCard db={db} userId={userId} />
      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">Fan fiction</h2>
        <p className="mt-1 text-sm text-contrast/70">Read each story fully, and check any uploaded cover, before approving. Approve only stories that follow every rule:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-contrast/80">
          {FAN_FICTION_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <div role="group" aria-label="Show stories" className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button key={f.id} variant={filter === f.id ? "primary" : "secondary"} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label} ({counts[f.id]})
            </Button>
          ))}
        </div>
        <div className="mt-3">{node}</div>
      </Card>

      {visible.length === 0 ? (
        <Card>
          <p className="text-sm text-contrast/70">{filter === "pending" ? "Nothing waiting for review." : "No stories here."}</p>
        </Card>
      ) : (
        visible.map((story) => (
          <Card key={story.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 gap-4">
              <FanStoryCover title={story.title} penName={story.pen_name} accent={shows.find((x) => x.id === story.show_id)?.accent_color ?? null} coverUrl={story.cover_url} size="thumb" />
              <div className="min-w-0">
                <h3 className="font-heading text-lg font-bold text-contrast">
                  {story.title}
                  {story.featured && <span className="ml-2 rounded-md bg-accent px-2 py-0.5 align-middle text-xs font-medium text-white">Editor&apos;s pick</span>}
                </h3>
                <p className="text-xs text-contrast/60">
                  by {story.pen_name} · {showName(story.show_id)} · submitted {formatDate(story.created_at)} · {story.body.length.toLocaleString()} characters
                  {isAdmin && emails[story.id] && ` · ${emails[story.id]}`}
                </p>
                <p className="mt-1 text-xs text-contrast/75">
                  {story.genres.map(genreLabel).join(", ")}
                  {story.content_notes.length > 0 && ` · Notes: ${story.content_notes.map(noteLabel).join(", ")}`}
                  {story.prompt && ` · Prompt: ${story.prompt.title}`}
                  {story.cover_url ? " · Own cover" : " · Automatic cover"}
                  {story.author?.display_name ? ` · Fan account: ${story.author.display_name}` : ""}
                  {story.chapter_count > 1 ? ` · ${story.chapter_count} chapters` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <label className="cursor-pointer rounded-md border border-contrast/20 px-2.5 py-1 text-contrast hover:border-contrast/40 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
                    {story.cover_url ? "Replace cover" : "Add a cover"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      aria-label={`${story.cover_url ? "Replace" : "Add a"} cover for ${story.title}`}
                      onChange={(e) => {
                        replaceCover(story, e.target.files?.[0])
                        e.target.value = ""
                      }}
                    />
                  </label>
                  {story.cover_url && (
                    <button type="button" onClick={() => removeCover(story)} aria-label={`Use the automatic cover for ${story.title}`} className="rounded-md border border-contrast/20 px-2.5 py-1 text-contrast hover:border-contrast/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                      Use automatic cover
                    </button>
                  )}
                </div>
              </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {story.status !== "approved" && <Button onClick={() => setStatus(story, "approved")} aria-label={`Approve ${story.title}`}>Approve</Button>}
                {story.status === "approved" && (
                  <>
                    <a
                      href={`/fanzone/fiction/${story.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-contrast/20 px-4 py-2 text-sm font-medium text-contrast hover:border-contrast/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      aria-label={`View ${story.title} (opens in a new tab)`}
                    >
                      View
                    </a>
                    <Button variant="secondary" onClick={() => toggleFeatured(story)} aria-label={`${story.featured ? "Remove" : "Make"} ${story.title} ${story.featured ? "from" : "an"} editor's pick`}>
                      {story.featured ? "Remove pick" : "Make editor's pick"}
                    </Button>
                    <Button variant="secondary" onClick={() => setStatus(story, "pending")} aria-label={`Unpublish ${story.title}`}>Unpublish</Button>
                  </>
                )}
                {story.status === "pending" && (
                  <Button variant="secondary" onClick={() => setDeclining(declining === story.id ? null : story.id)} aria-expanded={declining === story.id} aria-label={`Decline ${story.title}`}>
                    Decline
                  </Button>
                )}
                <Button variant="danger" onClick={() => remove(story)} aria-label={`Delete ${story.title}`}>Delete</Button>
              </div>
            </div>
            {declining === story.id && (
              <DeclineBox
                db={db}
                userId={userId}
                storyId={story.id}
                onCancel={() => setDeclining(null)}
                onDone={(error) => {
                  if (error) return fail("Couldn't decline the story.", error)
                  ok(`"${story.title}" declined.${story.author ? " The writer has been notified with your note." : ""}`)
                  setDeclining(null)
                  load()
                }}
              />
            )}
            {story.blurb && <p className="mt-3 text-sm italic text-contrast/80">{story.blurb}</p>}
            <details className="mt-3" open={story.status === "pending"}>
              <summary className="cursor-pointer text-sm font-medium text-contrast/80 hover:text-contrast">Read the story</summary>
              <div className="mt-3 max-h-[28rem] space-y-3 overflow-y-auto rounded-xl border border-contrast/10 p-4 text-sm leading-relaxed text-contrast/90">
                {story.body.split(/\n\s*\n/).map((p, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {p.trim()}
                  </p>
                ))}
              </div>
            </details>
          </Card>
        ))
      )}
    </div>
  )
}
