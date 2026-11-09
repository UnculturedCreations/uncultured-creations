"use client"

import { useCallback, useEffect, useId, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Session } from "@supabase/supabase-js"
import { getFanClient } from "@/lib/supabaseFan"
import { focusRing } from "@/app/components/fanzone/ui"
import { AUTH_CHANGE_EVENT } from "@/app/components/common/AccountLink"

// Sign-in options, shown only when switched on in Supabase (Authentication > Providers).
const PROVIDERS = [
  { id: "google", settingKeys: ["google"], label: "Continue with Google" },
  { id: "x", settingKeys: ["x", "twitter"], label: "Continue with X" },
  { id: "facebook", settingKeys: ["facebook"], label: "Continue with Facebook" },
] as const

const NAME_RULE = /^[A-Za-z0-9 _.'-]{2,30}$/
const NEXT_KEY = "uc-auth-next"

// Only same-site paths, so the link can't be used to send fans elsewhere.
function safeNext(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null
}

interface Profile {
  display_name: string | null
  name_confirmed: boolean
  adult_confirmed_at: string | null
  role: string
}

const card = "rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-6"
const input = `w-full rounded-lg border border-contrast/20 bg-base px-3 py-2.5 text-contrast ${focusRing}`
const primary = `rounded-lg bg-accent px-5 py-2.5 font-medium text-white disabled:opacity-50 ${focusRing}`
const secondary = `rounded-lg border border-contrast/20 px-5 py-2.5 font-medium text-contrast hover:border-contrast/40 disabled:opacity-50 ${focusRing}`

function nameProblem(name: string): string | null {
  const n = name.trim()
  if (n.length < 2 || n.length > 30) return "Use 2 to 30 characters."
  if (!NAME_RULE.test(n)) return "Use letters, numbers, spaces and _ . ' - only."
  return null
}

export default function AccountApp() {
  const db = getFanClient()
  const id = useId()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [enabled, setEnabled] = useState<string[] | null>(null)
  const [name, setName] = useState("")
  const [adult, setAdult] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null)
  const router = useRouter()

  // Remember where the fan came from (e.g. a prediction), across the sign-in redirect.
  useEffect(() => {
    const next = safeNext(new URLSearchParams(window.location.search).get("next"))
    if (next) {
      try {
        sessionStorage.setItem(NEXT_KEY, next)
      } catch {}
    }
  }, [])

  // Which sign-in options are switched on.
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!url || !key) return setEnabled([])
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: { external?: Record<string, boolean> } | null) =>
        setEnabled(PROVIDERS.filter((p) => p.settingKeys.some((k) => s?.external?.[k])).map((p) => p.id)),
      )
      .catch(() => setEnabled([]))
  }, [])

  useEffect(() => {
    if (!db) return
    db.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = db.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT)) // keep the header's account link in step
    })
    return () => sub.subscription.unsubscribe()
  }, [db])

  const loadProfile = useCallback(async () => {
    if (!db || !session) return setProfile(null)
    const { data } = await db.from("profiles").select("display_name, name_confirmed, adult_confirmed_at, role").eq("id", session.user.id).maybeSingle()
    setProfile((data as Profile) ?? null)
    setName((data as Profile | null)?.display_name ?? "")
  }, [db, session])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Once signed in and set up, take the fan back to where they started.
  useEffect(() => {
    if (!profile?.name_confirmed || !profile.adult_confirmed_at) return
    let next: string | null = null
    try {
      next = safeNext(sessionStorage.getItem(NEXT_KEY))
      sessionStorage.removeItem(NEXT_KEY)
    } catch {}
    if (next) router.replace(next)
  }, [profile, router])

  async function signIn(provider: string) {
    if (!db) return
    setMessage(null)
    const { error } = await db.auth.signInWithOAuth({
      provider: provider as "google",
      options: { redirectTo: `${window.location.origin}/account` },
    })
    if (error) setMessage({ kind: "error", text: "Sign-in couldn't start. Please try again." })
  }

  async function saveName(e: FormEvent, confirmAdult: boolean) {
    e.preventDefault()
    if (!db || !session) return
    const problem = nameProblem(name)
    if (problem) return setMessage({ kind: "error", text: problem })
    if (confirmAdult && !adult) return setMessage({ kind: "error", text: "Please confirm you're 18 or older." })
    setBusy(true)
    const changes: Record<string, unknown> = { display_name: name.trim(), name_confirmed: true }
    if (confirmAdult) changes.adult_confirmed_at = new Date().toISOString()
    const { error } = await db.from("profiles").update(changes).eq("id", session.user.id)
    setBusy(false)
    if (error) {
      return setMessage({
        kind: "error",
        text: error.code === "23505" ? "That name is taken. Try another." : "Couldn't save your name. Please try again.",
      })
    }
    setMessage({ kind: "ok", text: confirmAdult ? "You're all set. Welcome!" : "Name saved." })
    loadProfile()
  }

  async function signOut() {
    await db?.auth.signOut()
    setMessage({ kind: "ok", text: "You're signed out." })
  }

  async function deleteAccount() {
    if (!db || !session) return
    if (!window.confirm("Delete your account? Your fan name and account details are removed permanently. This can't be undone.")) return
    setBusy(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({
          kind: "error",
          text: body.error === "staff_account" ? "Editor and admin accounts can't be deleted here. Ask the site admin." : "Couldn't delete your account. Please try again.",
        })
        return
      }
      await db.auth.signOut()
      setMessage({ kind: "ok", text: "Your account has been deleted." })
    } finally {
      setBusy(false)
    }
  }

  const status = message && (
    <p role={message.kind === "error" ? "alert" : "status"} className={`mt-4 text-sm ${message.kind === "error" ? "text-[#FCA5A5]" : "text-[#4ADE80]"}`}>
      {message.text}
    </p>
  )

  if (!db) return <p className="text-contrast/80">Accounts aren&apos;t available right now.</p>
  if (session === undefined) return <p className="text-contrast/70">Loading...</p>

  // Signed out: sign-in options.
  if (!session) {
    const options = PROVIDERS.filter((p) => enabled?.includes(p.id))
    return (
      <div className={card}>
        <h2 className="font-heading text-2xl font-bold text-contrast">Sign in</h2>
        <p className="mt-2 text-contrast/80">
          Use the account you already have. Your fan account lets you join leaderboards and, soon, comment on stories. Accounts are for people aged 18 or older.
        </p>
        <div className="mt-6 flex max-w-sm flex-col gap-3">
          {enabled === null ? (
            <p className="text-sm text-contrast/70">Loading sign-in options...</p>
          ) : options.length === 0 ? (
            <p className="text-sm text-contrast/70">Sign-in isn&apos;t open yet. Check back soon.</p>
          ) : (
            options.map((p) => (
              <button key={p.id} type="button" onClick={() => signIn(p.id)} className={`${secondary} w-full text-left`}>
                {p.label}
              </button>
            ))
          )}
        </div>
        <p className="mt-6 text-sm text-contrast/70">
          We only see your name and email from the account you use, and never post anything for you. See our{" "}
          <Link href="/privacy" className={`rounded-sm underline underline-offset-4 hover:text-contrast ${focusRing}`}>
            privacy notice
          </Link>
          .
        </p>
        {status}
      </div>
    )
  }

  if (!profile) return <p className="text-contrast/70">Loading your account...</p>
  const provider = (session.user.app_metadata?.provider as string | undefined) ?? "your account"
  const providerName = provider === "google" ? "Google" : provider === "x" || provider === "twitter" ? "X" : provider === "facebook" ? "Facebook" : provider

  // First sign-in: confirm the public name and age.
  if (!profile.name_confirmed || !profile.adult_confirmed_at) {
    return (
      <form onSubmit={(e) => saveName(e, true)} className={card} noValidate>
        <h2 className="font-heading text-2xl font-bold text-contrast">Welcome to Reality Reloaded</h2>
        <p className="mt-2 text-contrast/80">This is the name other fans will see on leaderboards. Keep it, or change it to anything you like.</p>
        <div className="mt-5 max-w-sm">
          <label htmlFor={`${id}-name`} className="mb-1 block text-sm font-medium text-contrast">
            Your fan name
          </label>
          <input id={`${id}-name`} value={name} maxLength={30} onChange={(e) => setName(e.target.value)} className={input} aria-describedby={`${id}-hint`} />
          <p id={`${id}-hint`} className="mt-1 text-xs text-contrast/60">
            2 to 30 characters: letters, numbers, spaces and _ . &apos; -
          </p>
        </div>
        <label className="mt-5 flex items-start gap-3 text-sm text-contrast">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0066FF]" />
          I&apos;m 18 or older.
        </label>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" disabled={busy} className={primary}>
            Continue
          </button>
          <button type="button" onClick={deleteAccount} disabled={busy} className={secondary}>
            I&apos;m under 18: remove my account
          </button>
        </div>
        {status}
      </form>
    )
  }

  // Signed in.
  return (
    <div className="space-y-6">
      <div className={card}>
        <h2 className="font-heading text-2xl font-bold text-contrast">{profile.display_name}</h2>
        <p className="mt-1 text-sm text-contrast/70">
          Signed in with {providerName}
          {session.user.email ? ` as ${session.user.email}` : ""}. Your email is never shown to other fans.
        </p>
        <form onSubmit={(e) => saveName(e, false)} className="mt-6 max-w-sm" noValidate>
          <label htmlFor={`${id}-rename`} className="mb-1 block text-sm font-medium text-contrast">
            Fan name
          </label>
          <div className="flex gap-2">
            <input id={`${id}-rename`} value={name} maxLength={30} onChange={(e) => setName(e.target.value)} className={input} />
            <button type="submit" disabled={busy || name.trim() === profile.display_name} className={primary}>
              Save
            </button>
          </div>
        </form>
        {status}
      </div>
      <div className={card}>
        <h2 className="font-heading text-lg font-bold text-contrast">Your account</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={signOut} className={secondary}>
            Sign out
          </button>
          <button type="button" onClick={deleteAccount} disabled={busy} className={`rounded-lg border border-[#FCA5A5]/40 px-5 py-2.5 font-medium text-[#FCA5A5] hover:border-[#FCA5A5] disabled:opacity-50 ${focusRing}`}>
            Delete my account
          </button>
        </div>
      </div>
    </div>
  )
}
