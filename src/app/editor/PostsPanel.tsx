"use client"

import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button, Card, Field, Select, TextArea, TextInput, formatDate, useNotice, useShows } from "./fields"

const KINDS = [
  { value: "news", label: "News" },
  { value: "gossip", label: "Gossip" },
  { value: "trending", label: "Trending" },
  { value: "recap", label: "Recap" },
  { value: "scenario", label: "What could happen" },
]

interface PostRow {
  id: string
  show_id: string | null
  kind: string
  title: string
  summary: string | null
  source_name: string | null
  source_url: string | null
  status: "draft" | "published"
  published_at: string | null
  is_sample: boolean
}

const EMPTY = { id: "", show_id: "", kind: "news", title: "", summary: "", source_name: "", source_url: "" }

export default function PostsPanel({ db, userId }: { db: SupabaseClient; userId: string }) {
  const { shows } = useShows(db)
  const { ok, fail, clear, node: noticeNode } = useNotice()
  const [posts, setPosts] = useState<PostRow[]>([])
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await db
      .from("posts")
      .select("id, show_id, kind, title, summary, source_name, source_url, status, published_at, is_sample")
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) fail("Couldn't load posts.", error)
    setPosts((data ?? []) as PostRow[])
  }, [db, fail])

  useEffect(() => {
    load()
  }, [load])

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  const showName = (id: string | null) => (id ? (shows.find((s) => s.id === id)?.short_name ?? shows.find((s) => s.id === id)?.name ?? "") : "All shows")

  async function save(publish: boolean) {
    clear()
    if (!form.title.trim()) return fail("Add a headline first.")
    if (form.source_url && !form.source_url.startsWith("https://")) return fail("Source links must start with https://")
    setBusy(true)
    const existing = posts.find((p) => p.id === form.id)
    const row = {
      show_id: form.show_id || null,
      kind: form.kind,
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      source_name: form.source_name.trim() || null,
      source_url: form.source_url.trim() || null,
      status: publish ? "published" : "draft",
      // Keep the original publish time when re-saving a published post.
      published_at: publish ? (existing?.published_at ?? new Date().toISOString()) : null,
    }
    const { error } = form.id
      ? await db.from("posts").update(row).eq("id", form.id)
      : await db.from("posts").insert({ ...row, author_id: userId })
    setBusy(false)
    if (error) return fail("Couldn't save the post.", error)
    ok(publish ? "Published. It appears on the site within a minute." : "Saved as a draft.")
    setForm(EMPTY)
    load()
  }

  async function setStatus(post: PostRow, publish: boolean) {
    const { error } = await db
      .from("posts")
      .update({ status: publish ? "published" : "draft", published_at: publish ? (post.published_at ?? new Date().toISOString()) : null })
      .eq("id", post.id)
    if (error) return fail("Couldn't update the post.", error)
    ok(publish ? "Published." : "Moved back to drafts.")
    load()
  }

  async function remove(post: PostRow) {
    if (!window.confirm(`Delete "${post.title}"? This can't be undone.`)) return
    const { error } = await db.from("posts").delete().eq("id", post.id)
    if (error) return fail("Couldn't delete the post.", error)
    ok("Post deleted.")
    if (form.id === post.id) setForm(EMPTY)
    load()
  }

  function edit(post: PostRow) {
    setForm({
      id: post.id,
      show_id: post.show_id ?? "",
      kind: post.kind,
      title: post.title,
      summary: post.summary ?? "",
      source_name: post.source_name ?? "",
      source_url: post.source_url ?? "",
    })
    clear()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">{form.id ? "Edit post" : "New post"}</h2>
        <p className="mt-1 text-sm text-contrast/70">
          Write the headline and summary in your own words. For news, link to the original article rather than copying it.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Show" hint="“All shows” appears on the Reality Reloaded home page only.">
            {(id) => (
              <Select id={id} value={form.show_id} onChange={set("show_id")}>
                <option value="">All shows</option>
                {shows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Type" hint="News, gossip and trending also appear in Top stories.">
            {(id) => (
              <Select id={id} value={form.kind} onChange={set("kind")}>
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="sm:col-span-2">
            <Field label="Headline" hint={`${form.title.length}/160`}>
              {(id) => <TextInput id={id} value={form.title} onChange={set("title")} maxLength={160} required />}
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Summary" hint={`${form.summary.length}/1000`}>
              {(id) => <TextArea id={id} value={form.summary} onChange={set("summary")} maxLength={1000} rows={4} />}
            </Field>
          </div>
          <Field label="Source name (optional)" hint="For example, the news site's name.">
            {(id) => <TextInput id={id} value={form.source_name} onChange={set("source_name")} maxLength={80} />}
          </Field>
          <Field label="Source link (optional)" hint="Must start with https://">
            {(id) => <TextInput id={id} type="url" value={form.source_url} onChange={set("source_url")} placeholder="https://" />}
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => save(true)} disabled={busy}>
            Publish
          </Button>
          <Button variant="secondary" onClick={() => save(false)} disabled={busy}>
            Save as draft
          </Button>
          {form.id && (
            <Button variant="secondary" onClick={() => setForm(EMPTY)}>
              Cancel editing
            </Button>
          )}
        </div>
        <div className="mt-3">{noticeNode}</div>
      </Card>

      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">Recent posts</h2>
        {posts.length === 0 ? (
          <p className="mt-3 text-sm text-contrast/70">No posts yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-contrast/10">
            {posts.map((post) => (
              <li key={post.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-contrast">{post.title}</p>
                  <p className="text-xs text-contrast/60">
                    {post.status === "published" ? `Published ${formatDate(post.published_at)}` : "Draft"} · {showName(post.show_id)} ·{" "}
                    {KINDS.find((k) => k.value === post.kind)?.label}
                    {post.is_sample && " · Sample"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => edit(post)} aria-label={`Edit ${post.title}`}>
                    Edit
                  </Button>
                  <Button variant="secondary" onClick={() => setStatus(post, post.status !== "published")} aria-label={`${post.status === "published" ? "Unpublish" : "Publish"} ${post.title}`}>
                    {post.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="danger" onClick={() => remove(post)} aria-label={`Delete ${post.title}`}>
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
