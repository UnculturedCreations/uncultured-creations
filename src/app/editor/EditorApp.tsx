"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import type { Session } from "@supabase/supabase-js"
import { getBrowserClient } from "@/lib/supabaseBrowser"
import { Button, Card, Field, TextInput, focusRing } from "./fields"
import PostsPanel from "./PostsPanel"
import PollsPanel from "./PollsPanel"
import QuizzesPanel from "./QuizzesPanel"
import ShowsPanel from "./ShowsPanel"
import SeasonsPanel from "./SeasonsPanel"
import SignupsPanel from "./SignupsPanel"
import BingoPanel from "./BingoPanel"
import FanFictionPanel from "./FanFictionPanel"
import PredictionsPanel from "./PredictionsPanel"
import CommentsPanel from "./CommentsPanel"

const TABS = [
  { id: "posts", label: "Posts" },
  { id: "polls", label: "Polls" },
  { id: "predictions", label: "Predictions" },
  { id: "quizzes", label: "Quizzes" },
  { id: "bingo", label: "Bingo" },
  { id: "fiction", label: "Fan fiction" },
  { id: "comments", label: "Comments" },
  { id: "seasons", label: "Seasons and rankings" },
  { id: "signups", label: "Yard sign-ups", adminOnly: true },
  { id: "shows", label: "Shows and schedule" },
] as const satisfies readonly { id: string; label: string; adminOnly?: boolean }[]
type Tab = (typeof TABS)[number]["id"]

type Role = "loading" | "fan" | "editor" | "admin" | "unknown"

function SignIn({ onError }: { onError: (m: string) => void }) {
  const db = getBrowserClient()!
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await db.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) onError("Sign-in failed. Check your email and password.")
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email">{(id) => <TextInput id={id} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
      <Field label="Password">
        {(id) => <TextInput id={id} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
      </Field>
      <Button type="submit" disabled={busy}>
        {busy ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}

export default function EditorApp() {
  const db = getBrowserClient()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [role, setRole] = useState<Role>("loading")
  const [tab, setTab] = useState<Tab>("posts")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!db) return
    db.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = db.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setError("")
    })
    return () => sub.subscription.unsubscribe()
  }, [db])

  useEffect(() => {
    if (!db || !session) return
    setRole("loading")
    db.from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setRole((data?.role as Role) ?? "unknown"))
  }, [db, session])

  const signOut = () => db?.auth.signOut()

  if (!db) {
    return <p className="text-contrast/80">The editor isn&apos;t configured: the Supabase settings are missing.</p>
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-contrast/60">Reality Reloaded</p>
          <h1 className="font-heading text-3xl font-bold text-contrast">Editor</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/fanzone" className={`rounded-sm text-contrast/70 underline-offset-4 hover:text-contrast hover:underline ${focusRing}`}>
            View the site
          </Link>
          {session && (
            <Button variant="secondary" onClick={signOut}>
              Sign out
            </Button>
          )}
        </div>
      </header>

      {session === undefined ? (
        <p className="text-contrast/70">Loading...</p>
      ) : !session ? (
        <Card>
          <h2 className="font-heading text-xl font-bold text-contrast">Sign in</h2>
          <p className="mb-5 mt-1 text-sm text-contrast/70">For Reality Reloaded editors. Accounts are created by the site admin.</p>
          <SignIn onError={setError} />
          <p role="alert" className="mt-3 min-h-[1.25rem] text-sm text-[#FCA5A5]">
            {error}
          </p>
        </Card>
      ) : role === "loading" ? (
        <p className="text-contrast/70">Checking your access...</p>
      ) : role !== "editor" && role !== "admin" ? (
        <Card>
          <h2 className="font-heading text-xl font-bold text-contrast">No editor access yet</h2>
          <p className="mt-2 text-sm text-contrast/80">
            You&apos;re signed in as {session.user.email}, but this account isn&apos;t an editor. Ask the site admin to give it editor access, then
            sign in again.
          </p>
        </Card>
      ) : (
        <>
          <nav aria-label="Editor sections" className="flex flex-wrap gap-2 border-b border-contrast/10 pb-3">
            {TABS.filter((t) => !("adminOnly" in t) || role === "admin").map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${focusRing} ${tab === t.id ? "bg-contrast/10 text-contrast" : "text-contrast/70 hover:text-contrast"}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <p className="text-sm text-contrast/60">Signed in as {session.user.email}. Changes appear on the site within about a minute.</p>
          {tab === "posts" && <PostsPanel db={db} userId={session.user.id} />}
          {tab === "polls" && <PollsPanel db={db} userId={session.user.id} />}
          {tab === "predictions" && <PredictionsPanel db={db} userId={session.user.id} />}
          {tab === "quizzes" && <QuizzesPanel db={db} userId={session.user.id} />}
          {tab === "bingo" && <BingoPanel db={db} userId={session.user.id} />}
          {tab === "fiction" && <FanFictionPanel db={db} userId={session.user.id} isAdmin={role === "admin"} />}
          {tab === "comments" && <CommentsPanel db={db} />}
          {tab === "seasons" && <SeasonsPanel db={db} />}
          {tab === "shows" && <ShowsPanel db={db} />}
          {tab === "signups" && role === "admin" && <SignupsPanel db={db} />}
        </>
      )}
    </div>
  )
}
