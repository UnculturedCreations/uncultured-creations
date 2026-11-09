"use client"

import { useEffect, useId, useState, type FormEvent } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CONTENT_NOTES, GENRES } from "./fanFiction"
import FanStoryCover from "./FanStoryCover"
import { toCoverJpeg } from "./imageTools"
import { focusRing } from "./ui"
import { loadWriter, writerError, type Writer } from "./writer"

const control = `w-full rounded-lg border border-contrast/20 bg-base px-3 py-2.5 text-contrast placeholder:text-contrast/40 ${focusRing}`

interface Props {
  shows: { id: string; name: string; accent: string | null }[]
  prompts: { id: string; title: string }[]
  enabled: boolean
  defaultShowId?: string
  defaultPromptId?: string
  storyId?: string // editing an existing story that's waiting or was declined
}

export default function WriterStoryForm({ shows, prompts, enabled, defaultShowId, defaultPromptId, storyId }: Props) {
  const id = useId()
  const router = useRouter()
  const pathname = usePathname()
  const [writer, setWriter] = useState<Writer | undefined>(undefined)
  const [form, setForm] = useState({ show_id: defaultShowId ?? "", title: "", pen_name: "", blurb: "", body: "" })
  const [genres, setGenres] = useState<string[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [promptId, setPromptId] = useState(defaultPromptId ?? "")
  const [cover, setCover] = useState<{ url: string; blob: Blob | null } | null>(null)
  const [coverMsg, setCoverMsg] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [phase, setPhase] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [message, setMessage] = useState("")
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadWriter().then(async (w) => {
      setWriter(w)
      if (!w) return
      if (!storyId) return setForm((f) => ({ ...f, pen_name: f.pen_name || w.fanName || "" }))
      const { data } = await w.db
        .from("fan_stories")
        .select("show_id, title, pen_name, blurb, body, genres, content_notes, prompt_id, cover_url, status, author_id")
        .eq("id", storyId)
        .maybeSingle()
      if (!data || data.author_id !== w.userId || data.status === "approved") return setNotFound(true)
      setForm({ show_id: data.show_id ?? "", title: data.title, pen_name: data.pen_name, blurb: data.blurb ?? "", body: data.body })
      setGenres(data.genres)
      setNotes(data.content_notes)
      setPromptId(data.prompt_id ?? "")
      if (data.cover_url) setCover({ url: data.cover_url, blob: null })
      setAgreed(true)
    })
  }, [storyId])

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  const length = form.body.trim().length
  const accent = shows.find((s) => s.id === form.show_id)?.accent ?? null
  const toggle = (list: string[], value: string, max: number) => (list.includes(value) ? list.filter((v) => v !== value) : list.length >= max ? list : [...list, value])

  async function chooseCover(file: File | undefined) {
    setCoverMsg("")
    if (!file) return
    if (!file.type.startsWith("image/")) return setCoverMsg("Choose an image file.")
    if (file.size > 20 * 1024 * 1024) return setCoverMsg("That image is over 20 MB. Choose a smaller one.")
    try {
      const blob = await toCoverJpeg(file, 600, 900)
      setCover({ url: URL.createObjectURL(blob), blob })
    } catch {
      setCoverMsg("We couldn't read that image. Try another one.")
    }
  }

  function problem(): string | null {
    if (!form.title.trim()) return "Give your story a title."
    if (!form.pen_name.trim()) return "Add a pen name: it's how you'll be credited."
    if (genres.length === 0) return "Choose at least one genre."
    if (length < 300) return `Your story needs at least 300 characters (it has ${length}).`
    if (length > 20000) return "Your story is over 20,000 characters. Please shorten it, or send the rest as chapters once it's published."
    if (!agreed) return "Please confirm your story follows the rules."
    return null
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!writer) return
    const issue = problem()
    if (issue) {
      setPhase("error")
      return setMessage(issue)
    }
    setPhase("sending")
    setMessage("")
    let coverUrl: string | null = cover && !cover.blob ? cover.url : null
    if (cover?.blob) {
      const path = `writers/${writer.userId}/${crypto.randomUUID()}.jpg`
      const { error } = await writer.db.storage.from("fan-covers").upload(path, cover.blob, { contentType: "image/jpeg" })
      if (error) {
        setPhase("error")
        return setMessage("Couldn't upload your cover. Try again, or use the automatic cover.")
      }
      coverUrl = writer.db.storage.from("fan-covers").getPublicUrl(path).data.publicUrl
    }
    const row = {
      show_id: form.show_id || null,
      title: form.title.trim(),
      pen_name: form.pen_name.trim(),
      blurb: form.blurb.trim() || null,
      body: form.body.trim(),
      genres,
      content_notes: notes,
      prompt_id: promptId || null,
      cover_url: coverUrl,
    }
    const { error } = storyId
      ? await writer.db.from("fan_stories").update(row).eq("id", storyId)
      : await writer.db.from("fan_stories").insert({ ...row, author_id: writer.userId, status: "pending" })
    if (error) {
      setPhase("error")
      return setMessage(writerError(error.message))
    }
    setPhase("done")
  }

  if (!enabled) return <p className="rounded-2xl border border-contrast/15 p-6 text-contrast/80">Submissions open soon. Check back shortly.</p>
  if (writer === undefined) return <p className="text-contrast/70">Loading...</p>
  const signIn = `/account?next=${encodeURIComponent(pathname ?? "/fanzone/fiction/submit")}`
  if (!writer || !writer.ready) {
    return (
      <div className="rounded-2xl border border-contrast/15 bg-contrast/[0.03] p-6">
        <h3 className="font-heading text-xl font-bold text-contrast">{writer ? "Finish setting up your account" : "Sign in to submit"}</h3>
        <p className="mt-2 text-contrast/80">
          Stories are linked to your fan account, so you can follow their review, fix and resubmit them, and add chapters once they&apos;re published.
        </p>
        <Link href={signIn} className={`mt-4 inline-flex rounded-lg bg-accent px-5 py-2.5 font-medium text-white ${focusRing}`}>
          {writer ? "Continue setting up" : "Sign in"}
        </Link>
      </div>
    )
  }
  if (notFound) return <p className="text-contrast/80">This story can&apos;t be edited: it may have been published or withdrawn.</p>
  if (phase === "done") {
    return (
      <div role="status" className="rounded-2xl border border-[#4ADE80]/40 bg-[#4ADE80]/10 p-6">
        <h3 className="font-heading text-xl font-bold text-contrast">{storyId ? "Changes saved and sent for review" : "Thanks, your story is in"}</h3>
        <p className="mt-2 text-contrast/85">An editor will read it before it&apos;s published. You can follow its progress under My stories.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => router.push("/account/stories")} className={`rounded-lg bg-accent px-5 py-2.5 font-medium text-white ${focusRing}`}>
            Go to My stories
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-title`} className="mb-1 block text-sm font-medium text-contrast">Title</label>
          <input id={`${id}-title`} maxLength={100} value={form.title} onChange={set("title")} className={control} />
        </div>
        <div>
          <label htmlFor={`${id}-pen`} className="mb-1 block text-sm font-medium text-contrast">Pen name</label>
          <input id={`${id}-pen`} maxLength={40} value={form.pen_name} onChange={set("pen_name")} className={control} aria-describedby={`${id}-pen-hint`} />
          <p id={`${id}-pen-hint`} className="mt-1 text-xs text-contrast/60">Shown on your story. It can differ from your fan name.</p>
        </div>
        <div>
          <label htmlFor={`${id}-show`} className="mb-1 block text-sm font-medium text-contrast">
            Show <span className="font-normal text-contrast/60">(optional)</span>
          </label>
          <select id={`${id}-show`} value={form.show_id} onChange={set("show_id")} className={control}>
            <option value="">Not about a particular show</option>
            {shows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {prompts.length > 0 ? (
          <div>
            <label htmlFor={`${id}-prompt`} className="mb-1 block text-sm font-medium text-contrast">
              Writing prompt <span className="font-normal text-contrast/60">(optional)</span>
            </label>
            <select id={`${id}-prompt`} value={promptId} onChange={(e) => setPromptId(e.target.value)} className={control}>
              <option value="">Not written for a prompt</option>
              {prompts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div />
        )}
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-blurb`} className="mb-1 block text-sm font-medium text-contrast">
            One-line teaser <span className="font-normal text-contrast/60">(optional)</span>
          </label>
          <input id={`${id}-blurb`} maxLength={300} value={form.blurb} onChange={set("blurb")} className={control} placeholder="Shown on your story's card" />
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-medium text-contrast">
            Genre <span className="font-normal text-contrast/60">(choose 1 to 3)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <label key={g.value} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${genres.includes(g.value) ? "border-accent bg-accent/20 text-contrast" : "border-contrast/15 text-contrast/85"}`}>
                <input type="checkbox" className="sr-only" checked={genres.includes(g.value)} onChange={() => setGenres(toggle(genres, g.value, 3))} />
                {g.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-medium text-contrast">
            Content notes <span className="font-normal text-contrast/60">(optional; helps readers choose)</span>
          </legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-contrast">
            {CONTENT_NOTES.map((n) => (
              <label key={n.value} className="flex items-center gap-2">
                <input type="checkbox" checked={notes.includes(n.value)} onChange={() => setNotes(toggle(notes, n.value, 4))} className="h-4 w-4 accent-[#0066FF]" />
                {n.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium text-contrast">
            Cover <span className="font-normal text-contrast/60">(optional)</span>
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <FanStoryCover title={form.title || "Your title"} penName={form.pen_name || "Your pen name"} accent={accent} coverUrl={cover?.url ?? null} />
            <div className="space-y-2 text-sm">
              <p className="max-w-xs text-contrast/70">{cover ? "An editor checks your cover with your story." : "Without your own image, your story gets this cover automatically."}</p>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-lg border border-contrast/20 px-4 py-2 font-medium text-contrast hover:border-contrast/40 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
                  {cover ? "Replace cover" : "Upload your own cover"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label={cover ? "Replace cover image" : "Upload your own cover image"}
                    onChange={(e) => {
                      chooseCover(e.target.files?.[0])
                      e.target.value = ""
                    }}
                  />
                </label>
                {cover && (
                  <button type="button" onClick={() => setCover(null)} className={`rounded-lg border border-contrast/20 px-4 py-2 font-medium text-contrast ${focusRing}`}>
                    Use automatic cover
                  </button>
                )}
              </div>
              {coverMsg && <p role="alert" className="text-[#FCA5A5]">{coverMsg}</p>}
            </div>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-body`} className="mb-1 block text-sm font-medium text-contrast">{storyId ? "Your story (chapter 1)" : "Your story"}</label>
          <textarea id={`${id}-body`} rows={14} maxLength={20000} value={form.body} onChange={set("body")} className={control} aria-describedby={`${id}-count`} />
          <p id={`${id}-count`} className={`mt-1 text-xs ${length > 0 && length < 300 ? "text-[#FCA5A5]" : "text-contrast/60"}`}>
            {length.toLocaleString()} of 300 to 20,000 characters. Leave a blank line between paragraphs. Longer stories can continue in chapters once published.
          </p>
        </div>
      </div>
      <label className="flex items-start gap-3 text-sm text-contrast">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0066FF]" />
        <span>
          My story follows the rules above, and I&apos;m happy for Uncultured Creations to publish it on Reality Reloaded. I keep the rights to my story and can ask for it to be
          removed at any time.
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={phase === "sending"} className={`rounded-lg bg-accent px-6 py-3 font-medium text-white disabled:opacity-50 ${focusRing}`}>
          {phase === "sending" ? "Sending..." : storyId ? "Save and resubmit" : "Submit for review"}
        </button>
        <p role="status" aria-live="polite" className="text-sm text-[#FCA5A5]">
          {phase === "error" ? message : ""}
        </p>
      </div>
    </form>
  )
}
