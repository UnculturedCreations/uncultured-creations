"use client"

import { useId, useState, type FormEvent } from "react"
import Link from "next/link"
import { useTurnstile } from "./turnstile"
import { focusRing } from "./ui"

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const SIZES = [
  { value: "", label: "Not sure" },
  { value: "under_100", label: "Under 100" },
  { value: "100_1000", label: "100 to 1,000" },
  { value: "1000_10000", label: "1,000 to 10,000" },
  { value: "over_10000", label: "Over 10,000" },
]

const control = `w-full rounded-lg border border-contrast/20 bg-base px-3 py-2.5 text-contrast placeholder:text-contrast/40 ${focusRing}`

export default function YardSignupForm({ shows, enabled }: { shows: { id: string; name: string }[]; enabled: boolean }) {
  const id = useId()
  const [role, setRole] = useState<"landlord" | "resident">("landlord")
  const [form, setForm] = useState({ email: "", name: "", fanbase_name: "", show_id: "", fanbase_size: "", current_tools: "" })
  const [adult, setAdult] = useState(false)
  const [phase, setPhase] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [message, setMessage] = useState("")
  const ready = enabled && Boolean(SITE_KEY && SUPABASE_URL)
  const { containerRef, getToken, reset } = useTurnstile(SITE_KEY, ready && phase !== "done")
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      setPhase("error")
      return setMessage("Please enter a valid email address.")
    }
    if (!adult) {
      setPhase("error")
      return setMessage("Please confirm you're 18 or older.")
    }
    setPhase("sending")
    setMessage("")
    try {
      const token = await getToken()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/join-yard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role, adult, token, ...(role === "resident" ? { fanbase_size: "", current_tools: "" } : {}) }),
      })
      if (res.ok) {
        setPhase("done")
        return
      }
      setPhase("error")
      setMessage(
        res.status === 403
          ? "We couldn't confirm you're not a bot. Please try again."
          : res.status === 400
            ? "Please check your email address and try again."
            : "Something went wrong. Please try again.",
      )
    } catch {
      setPhase("error")
      setMessage("We couldn't send your details. Check your connection and try again.")
    } finally {
      reset()
    }
  }

  if (phase === "done") {
    return (
      <div role="status" className="rounded-2xl border border-[#4ADE80]/40 bg-[#4ADE80]/10 p-6">
        <h2 className="font-heading text-xl font-bold text-contrast">You&apos;re on the list</h2>
        <p className="mt-2 text-contrast/85">
          Thanks for signing up. We&apos;ll be in touch about early access to The Yard.
        </p>
      </div>
    )
  }

  if (!ready) {
    return <p className="rounded-2xl border border-contrast/15 p-6 text-contrast/80">Sign-up opens soon. Check back shortly.</p>
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5" aria-describedby={`${id}-privacy`}>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-contrast">I&apos;m signing up as</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["landlord", "I run a fanbase", "I want a yard for my fanbase"],
              ["resident", "I'm a fan", "Tell me when my fanbase can join"],
            ] as const
          ).map(([value, title, hint]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-xl border p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${role === value ? "border-accent bg-accent/10" : "border-contrast/15 hover:border-contrast/30"}`}
            >
              <input type="radio" name={`${id}-role`} value={value} checked={role === value} onChange={() => setRole(value)} className="sr-only" />
              <span className="block font-medium text-contrast">{title}</span>
              <span className="block text-sm text-contrast/70">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-email`} className="mb-1 block text-sm font-medium text-contrast">
            Email
          </label>
          <input id={`${id}-email`} type="email" autoComplete="email" required value={form.email} onChange={set("email")} className={control} />
        </div>
        <div>
          <label htmlFor={`${id}-name`} className="mb-1 block text-sm font-medium text-contrast">
            Name or nickname <span className="font-normal text-contrast/60">(optional)</span>
          </label>
          <input id={`${id}-name`} autoComplete="nickname" maxLength={80} value={form.name} onChange={set("name")} className={control} />
        </div>
        <div>
          <label htmlFor={`${id}-show`} className="mb-1 block text-sm font-medium text-contrast">
            Show <span className="font-normal text-contrast/60">(optional)</span>
          </label>
          <select id={`${id}-show`} value={form.show_id} onChange={set("show_id")} className={control}>
            <option value="">Choose a show</option>
            {shows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-fanbase`} className="mb-1 block text-sm font-medium text-contrast">
            Fanbase name <span className="font-normal text-contrast/60">(optional)</span>
          </label>
          <input id={`${id}-fanbase`} maxLength={80} value={form.fanbase_name} onChange={set("fanbase_name")} className={control} />
        </div>
        {role === "landlord" && (
          <>
            <div>
              <label htmlFor={`${id}-size`} className="mb-1 block text-sm font-medium text-contrast">
                Roughly how many members? <span className="font-normal text-contrast/60">(optional)</span>
              </label>
              <select id={`${id}-size`} value={form.fanbase_size} onChange={set("fanbase_size")} className={control}>
                {SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`${id}-tools`} className="mb-1 block text-sm font-medium text-contrast">
                How do you organise votes today? <span className="font-normal text-contrast/60">(optional)</span>
              </label>
              <textarea
                id={`${id}-tools`}
                rows={2}
                maxLength={300}
                placeholder="For example: WhatsApp groups and a spreadsheet"
                value={form.current_tools}
                onChange={set("current_tools")}
                className={control}
              />
            </div>
          </>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm text-contrast">
        <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} required className="mt-0.5 h-4 w-4 accent-[#0066FF]" />
        I&apos;m 18 or older.
      </label>

      <p id={`${id}-privacy`} className="text-sm text-contrast/70">
        We&apos;ll only use your details to contact you about The Yard. You can ask us to delete them at any time. See our{" "}
        <Link href="/privacy" className={`rounded-sm underline underline-offset-4 hover:text-contrast ${focusRing}`}>
          privacy notice
        </Link>
        .
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={phase === "sending"} className={`rounded-lg bg-accent px-6 py-3 font-medium text-white disabled:opacity-50 ${focusRing}`}>
          {phase === "sending" ? "Sending..." : "Join early access"}
        </button>
        <p role="status" aria-live="polite" className="text-sm text-[#FCA5A5]">
          {phase === "error" ? message : ""}
        </p>
      </div>
      <div ref={containerRef} className="empty:hidden" />
    </form>
  )
}
