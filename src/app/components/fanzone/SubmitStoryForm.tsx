"use client"

import { useId, useState, type FormEvent } from "react"
import Link from "next/link"
import { useTurnstile } from "./turnstile"
import { focusRing } from "./ui"

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const control = `w-full rounded-lg border border-contrast/20 bg-base px-3 py-2.5 text-contrast placeholder:text-contrast/40 ${focusRing}`

export default function SubmitStoryForm({ shows, enabled, defaultShowId }: { shows: { id: string; name: string }[]; enabled: boolean; defaultShowId?: string }) {
  const id = useId()
  const [form, setForm] = useState({ show_id: defaultShowId ?? "", title: "", pen_name: "", blurb: "", body: "", email: "" })
  const [agreed, setAgreed] = useState(false)
  const [adult, setAdult] = useState(false)
  const [phase, setPhase] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [message, setMessage] = useState("")
  const ready = enabled && Boolean(SITE_KEY && SUPABASE_URL)
  const { containerRef, getToken, reset } = useTurnstile(SITE_KEY, ready && phase !== "done")
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  const length = form.body.trim().length

  function problem(): string | null {
    if (!form.title.trim()) return "Give your story a title."
    if (!form.pen_name.trim()) return "Add a pen name: it's how you'll be credited."
    if (length < 300) return `Your story needs at least 300 characters (it has ${length}).`
    if (length > 20000) return "Your story is over 20,000 characters. Please shorten it."
    if (form.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return "Please check your email address, or leave it empty."
    if (!agreed) return "Please confirm your story follows the rules."
    if (!adult) return "Please confirm you're 18 or older."
    return null
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const issue = problem()
    if (issue) {
      setPhase("error")
      return setMessage(issue)
    }
    setPhase("sending")
    setMessage("")
    try {
      const token = await getToken()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, agreed, adult, token }),
      })
      if (res.ok) return setPhase("done")
      setPhase("error")
      setMessage(res.status === 403 ? "We couldn't confirm you're not a bot. Please try again." : res.status === 400 ? "Please check your story details and try again." : "Something went wrong. Please try again.")
    } catch {
      setPhase("error")
      setMessage("We couldn't send your story. Check your connection and try again. Your text is still here.")
    } finally {
      reset()
    }
  }

  if (phase === "done") {
    return (
      <div role="status" className="rounded-2xl border border-[#4ADE80]/40 bg-[#4ADE80]/10 p-6">
        <h2 className="font-heading text-xl font-bold text-contrast">Thanks, your story is in</h2>
        <p className="mt-2 text-contrast/85">Our editors read every submission. If it&apos;s approved, it will appear on Reality Reloaded under your pen name.</p>
      </div>
    )
  }
  if (!ready) return <p className="rounded-2xl border border-contrast/15 p-6 text-contrast/80">Submissions open soon. Check back shortly.</p>

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-title`} className="mb-1 block text-sm font-medium text-contrast">Title</label>
          <input id={`${id}-title`} maxLength={100} value={form.title} onChange={set("title")} className={control} />
        </div>
        <div>
          <label htmlFor={`${id}-pen`} className="mb-1 block text-sm font-medium text-contrast">Pen name</label>
          <input id={`${id}-pen`} maxLength={40} value={form.pen_name} onChange={set("pen_name")} className={control} />
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
        <div>
          <label htmlFor={`${id}-email`} className="mb-1 block text-sm font-medium text-contrast">
            Email <span className="font-normal text-contrast/60">(optional)</span>
          </label>
          <input id={`${id}-email`} type="email" autoComplete="email" value={form.email} onChange={set("email")} className={control} aria-describedby={`${id}-email-hint`} />
          <p id={`${id}-email-hint`} className="mt-1 text-xs text-contrast/60">Only if you&apos;d like us to be able to reach you. Never shown publicly.</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-blurb`} className="mb-1 block text-sm font-medium text-contrast">
            One-line teaser <span className="font-normal text-contrast/60">(optional)</span>
          </label>
          <input id={`${id}-blurb`} maxLength={300} value={form.blurb} onChange={set("blurb")} className={control} placeholder="Shown on your story's card" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-body`} className="mb-1 block text-sm font-medium text-contrast">Your story</label>
          <textarea id={`${id}-body`} rows={14} maxLength={20000} value={form.body} onChange={set("body")} className={control} aria-describedby={`${id}-count`} />
          <p id={`${id}-count`} className={`mt-1 text-xs ${length > 0 && length < 300 ? "text-[#FCA5A5]" : "text-contrast/60"}`}>
            {length.toLocaleString()} of 300 to 20,000 characters. Leave a blank line between paragraphs.
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm text-contrast">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0066FF]" />
          <span>
            My story follows the rules above, and I&apos;m happy for Uncultured Creations to publish it on Reality Reloaded. I keep the rights to my story and can ask
            for it to be removed at any time.
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0066FF]" />
          I&apos;m 18 or older.
        </label>
      </div>

      <p className="text-sm text-contrast/70">
        See our{" "}
        <Link href="/privacy" className={`rounded-sm underline underline-offset-4 hover:text-contrast ${focusRing}`}>
          privacy notice
        </Link>{" "}
        for how we handle your details.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={phase === "sending"} className={`rounded-lg bg-accent px-6 py-3 font-medium text-white disabled:opacity-50 ${focusRing}`}>
          {phase === "sending" ? "Sending..." : "Submit for review"}
        </button>
        <p role="status" aria-live="polite" className="text-sm text-[#FCA5A5]">
          {phase === "error" ? message : ""}
        </p>
      </div>
      <div ref={containerRef} className="empty:hidden" />
    </form>
  )
}
