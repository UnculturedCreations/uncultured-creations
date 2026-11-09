"use client"

import { useCallback, useEffect, useId, useState, type FormEvent } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import { focusRing, timeAgo } from "./ui"

interface Comment {
  id: string
  body: string
  created_at: string
  fan_name: string
  is_mine: boolean
}

type Me = { db: SupabaseClient; userId: string; ready: boolean; canComment: boolean } | null

// Loads the sign-in library only for fans signed in on this device.
async function loadMe(): Promise<Me> {
  try {
    if (!localStorage.getItem("uc-auth")) return null
  } catch {
    return null
  }
  const { getFanClient } = await import("@/lib/supabaseFan")
  const db = getFanClient()
  if (!db) return null
  const { data } = await db.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) return null
  const { data: p } = await db.from("profiles").select("name_confirmed, adult_confirmed_at, can_comment").eq("id", userId).maybeSingle()
  return { db, userId, ready: Boolean(p?.name_confirmed && p?.adult_confirmed_at), canComment: p?.can_comment !== false }
}

export default function StoryComments({ storyId }: { storyId: string }) {
  const id = useId()
  const pathname = usePathname()
  const [me, setMe] = useState<Me | undefined>(undefined)
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState(false)
  const [reported, setReported] = useState<string[]>([])
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null)

  const load = useCallback(async (who: Me) => {
    let rows: Comment[] | null = null
    if (who) {
      const { data } = await who.db.rpc("story_comments_list", { p_story_id: storyId })
      rows = (data as Comment[] | null) ?? []
    } else {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      if (url && key) {
        const res = await fetch(`${url}/rest/v1/rpc/story_comments_list`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: key },
          body: JSON.stringify({ p_story_id: storyId }),
        }).catch(() => null)
        rows = res?.ok ? await res.json() : []
      }
    }
    setComments(rows ?? [])
  }, [storyId])

  useEffect(() => {
    loadMe().then((who) => {
      setMe(who)
      load(who)
    })
  }, [load])

  async function post(e: FormEvent) {
    e.preventDefault()
    if (!me || !body.trim()) return
    setBusy(true)
    setMessage(null)
    const { error } = await me.db.from("story_comments").insert({ story_id: storyId, user_id: me.userId, body: body.trim() })
    setBusy(false)
    if (error) {
      const text = error.message.includes("slow_down")
        ? "You're commenting quickly. Wait a minute and try again."
        : error.message.includes("duplicate")
          ? "You've already posted that comment."
          : "Couldn't post your comment. Please try again."
      return setMessage({ kind: "error", text })
    }
    setBody("")
    setMessage({ kind: "ok", text: "Comment posted." })
    load(me)
  }

  async function remove(c: Comment) {
    if (!me || !window.confirm("Delete your comment?")) return
    const { error } = await me.db.from("story_comments").delete().eq("id", c.id)
    if (error) return setMessage({ kind: "error", text: "Couldn't delete your comment." })
    setMessage({ kind: "ok", text: "Comment deleted." })
    load(me)
  }

  async function report(c: Comment) {
    if (!me) return
    const { data, error } = await me.db.rpc("report_comment", { p_comment_id: c.id })
    if (error || data !== "ok") return setMessage({ kind: "error", text: "Couldn't report the comment. Please try again." })
    setReported([...reported, c.id])
    setMessage({ kind: "ok", text: "Thanks for reporting it. Our editors will take a look." })
  }

  const signIn = `/account?next=${encodeURIComponent(pathname ?? "/fanzone")}`
  const canPost = me?.ready && me.canComment

  return (
    <section aria-labelledby={`${id}-h`} className="mt-12 border-t border-contrast/10 pt-8">
      <h2 id={`${id}-h`} className="font-heading text-2xl font-bold text-contrast">
        Comments{comments && comments.length > 0 ? ` (${comments.length})` : ""}
      </h2>

      {me === undefined ? null : canPost ? (
        <form onSubmit={post} className="mt-4">
          <label htmlFor={`${id}-body`} className="sr-only">
            Your comment
          </label>
          <textarea
            id={`${id}-body`}
            rows={3}
            maxLength={1000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you think?"
            aria-describedby={`${id}-rule`}
            className={`w-full rounded-lg border border-contrast/20 bg-base px-3 py-2.5 text-contrast placeholder:text-contrast/40 ${focusRing}`}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p id={`${id}-rule`} className="text-xs text-contrast/60">
              Be kind. Comments that harass anyone, including housemates and their families, are removed. {body.length}/1000
            </p>
            <button type="submit" disabled={busy || !body.trim()} className={`rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-50 ${focusRing}`}>
              {busy ? "Posting..." : "Post comment"}
            </button>
          </div>
        </form>
      ) : me && me.ready && !me.canComment ? (
        <p className="mt-4 text-sm text-contrast/75">Commenting has been turned off for your account.</p>
      ) : (
        <p className="mt-4 text-sm text-contrast/80">
          <Link href={signIn} className={`rounded-sm font-medium text-contrast underline underline-offset-4 ${focusRing}`}>
            {me ? "Finish setting up your account" : "Sign in"}
          </Link>{" "}
          to join the conversation.
        </p>
      )}
      <p role="status" aria-live="polite" className={`mt-2 min-h-[1.25rem] text-sm ${message?.kind === "error" ? "text-[#FCA5A5]" : "text-[#4ADE80]"}`}>
        {message?.text}
      </p>

      {comments === null ? (
        <p className="mt-2 text-sm text-contrast/60">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="mt-2 text-sm text-contrast/70">No comments yet. Be the first.</p>
      ) : (
        <ul className="mt-2 space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border border-contrast/10 bg-contrast/[0.03] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm">
                  <span className="font-medium text-contrast">{c.fan_name}</span>
                  <span className="ml-2 text-xs text-contrast/55">{timeAgo(c.created_at)}</span>
                </p>
                {c.is_mine ? (
                  <button type="button" onClick={() => remove(c)} className={`rounded-sm text-xs text-contrast/60 underline underline-offset-2 hover:text-contrast ${focusRing}`} aria-label="Delete your comment">
                    Delete
                  </button>
                ) : canPost ? (
                  <button
                    type="button"
                    onClick={() => report(c)}
                    disabled={reported.includes(c.id)}
                    className={`rounded-sm text-xs text-contrast/60 underline underline-offset-2 hover:text-contrast disabled:no-underline disabled:opacity-60 ${focusRing}`}
                    aria-label={`Report comment by ${c.fan_name}`}
                  >
                    {reported.includes(c.id) ? "Reported" : "Report"}
                  </button>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-contrast/90">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
