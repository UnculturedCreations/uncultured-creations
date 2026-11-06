"use client"

import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { FAN_FICTION_RULES } from "@/app/components/fanzone/fanFiction"
import { Button, Card, formatDate, useNotice, useShows } from "./fields"

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
}

const FILTERS: { id: Status; label: string }[] = [
  { id: "pending", label: "Waiting for review" },
  { id: "approved", label: "Published" },
  { id: "declined", label: "Declined" },
]

export default function FanFictionPanel({ db, userId, isAdmin }: { db: SupabaseClient; userId: string; isAdmin: boolean }) {
  const { shows } = useShows(db)
  const { ok, fail, node } = useNotice()
  const [filter, setFilter] = useState<Status>("pending")
  const [stories, setStories] = useState<StoryRow[]>([])
  const [counts, setCounts] = useState<Record<Status, number>>({ pending: 0, approved: 0, declined: 0 })
  const [emails, setEmails] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    const { data, error } = await db
      .from("fan_stories")
      .select("id, slug, show_id, title, pen_name, blurb, body, status, published_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) fail("Couldn't load stories.", error)
    const rows = (data ?? []) as StoryRow[]
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
    ok("Story deleted.")
    load()
  }

  const showName = (id: string | null) => (id ? (shows.find((s) => s.id === id)?.name ?? "") : "No particular show")
  const visible = stories.filter((s) => s.status === filter)

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">Fan fiction</h2>
        <p className="mt-1 text-sm text-contrast/70">Read each story fully before approving. Approve only stories that follow every rule:</p>
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
              <div className="min-w-0">
                <h3 className="font-heading text-lg font-bold text-contrast">{story.title}</h3>
                <p className="text-xs text-contrast/60">
                  by {story.pen_name} · {showName(story.show_id)} · submitted {formatDate(story.created_at)} · {story.body.length.toLocaleString()} characters
                  {isAdmin && emails[story.id] && ` · ${emails[story.id]}`}
                </p>
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
                    <Button variant="secondary" onClick={() => setStatus(story, "pending")} aria-label={`Unpublish ${story.title}`}>Unpublish</Button>
                  </>
                )}
                {story.status === "pending" && <Button variant="secondary" onClick={() => setStatus(story, "declined")} aria-label={`Decline ${story.title}`}>Decline</Button>}
                <Button variant="danger" onClick={() => remove(story)} aria-label={`Delete ${story.title}`}>Delete</Button>
              </div>
            </div>
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
