"use client"

import { useEffect, useId, useState, type FormEvent } from "react"
import Link from "next/link"
import { loadWriter, writerError, type Writer } from "@/app/components/fanzone/writer"
import { FAN_FICTION_RULES } from "@/app/components/fanzone/fanFiction"
import { focusRing } from "@/app/components/fanzone/ui"

const control = `w-full rounded-lg border border-contrast/20 bg-base px-3 py-2.5 text-contrast ${focusRing}`

export default function ChapterForm({ storyId }: { storyId: string }) {
  const id = useId()
  const [writer, setWriter] = useState<Writer | undefined>(undefined)
  const [story, setStory] = useState<{ title: string; next: number } | null | undefined>(undefined)
  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [phase, setPhase] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const edit = new URLSearchParams(window.location.search).get("edit")
    loadWriter().then(async (w) => {
      setWriter(w)
      if (!w) return
      const { data } = await w.db.from("fan_stories").select("title, status, author_id, story_chapters(id, number, title, body, status)").eq("id", storyId).maybeSingle()
      if (!data || data.author_id !== w.userId || data.status !== "approved") return setStory(null)
      const chapters = (data.story_chapters ?? []) as { id: string; number: number; title: string | null; body: string; status: string }[]
      const editing = edit ? chapters.find((c) => c.id === edit && c.status !== "approved") : undefined
      if (editing) {
        setEditId(editing.id)
        setTitle(editing.title ?? "")
        setBody(editing.body)
      }
      setStory({ title: data.title, next: editing ? editing.number : Math.max(1, ...chapters.map((c) => c.number)) + 1 })
    })
  }, [storyId])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!writer) return
    const length = body.trim().length
    if (length < 300 || length > 20000) {
      setPhase("error")
      return setMessage(`A chapter needs 300 to 20,000 characters (it has ${length}).`)
    }
    setPhase("sending")
    const row = { title: title.trim() || null, body: body.trim() }
    const { error } = editId
      ? await writer.db.from("story_chapters").update(row).eq("id", editId)
      : await writer.db.from("story_chapters").insert({ ...row, story_id: storyId, number: 2 })
    if (error) {
      setPhase("error")
      return setMessage(writerError(error.message))
    }
    setPhase("done")
  }

  if (writer === undefined || story === undefined) return <p className="text-contrast/70">Loading...</p>
  if (!writer || !writer.ready) return <p className="text-contrast/80">Sign in to add chapters.</p>
  if (story === null) return <p className="text-contrast/80">Chapters can only be added to your own published stories.</p>
  if (phase === "done") {
    return (
      <div role="status" className="rounded-2xl border border-[#4ADE80]/40 bg-[#4ADE80]/10 p-6">
        <h2 className="font-heading text-xl font-bold text-contrast">Chapter {story.next} sent for review</h2>
        <p className="mt-2 text-contrast/85">It appears on your story once an editor approves it.</p>
        <Link href="/account/stories" className={`mt-4 inline-flex rounded-lg bg-accent px-5 py-2.5 font-medium text-white ${focusRing}`}>
          Back to My stories
        </Link>
      </div>
    )
  }

  const length = body.trim().length
  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <p className="text-contrast/80">
        {story.title}: chapter {story.next}. The same rules apply as for stories:
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-contrast/75">
        {FAN_FICTION_RULES.slice(0, 5).map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <div>
        <label htmlFor={`${id}-title`} className="mb-1 block text-sm font-medium text-contrast">
          Chapter title <span className="font-normal text-contrast/60">(optional)</span>
        </label>
        <input id={`${id}-title`} maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} className={control} />
      </div>
      <div>
        <label htmlFor={`${id}-body`} className="mb-1 block text-sm font-medium text-contrast">Chapter text</label>
        <textarea id={`${id}-body`} rows={14} maxLength={20000} value={body} onChange={(e) => setBody(e.target.value)} className={control} aria-describedby={`${id}-count`} />
        <p id={`${id}-count`} className={`mt-1 text-xs ${length > 0 && length < 300 ? "text-[#FCA5A5]" : "text-contrast/60"}`}>
          {length.toLocaleString()} of 300 to 20,000 characters. Leave a blank line between paragraphs.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={phase === "sending"} className={`rounded-lg bg-accent px-6 py-3 font-medium text-white disabled:opacity-50 ${focusRing}`}>
          {phase === "sending" ? "Sending..." : editId ? "Save and resubmit" : "Submit chapter for review"}
        </button>
        <p role="status" aria-live="polite" className="text-sm text-[#FCA5A5]">
          {phase === "error" ? message : ""}
        </p>
      </div>
    </form>
  )
}
