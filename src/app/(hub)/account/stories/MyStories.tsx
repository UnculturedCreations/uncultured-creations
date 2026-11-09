"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { loadWriter, type Writer } from "@/app/components/fanzone/writer"
import { focusRing, timeAgo } from "@/app/components/fanzone/ui"

interface Chapter {
  id: string
  number: number
  title: string | null
  status: "pending" | "approved" | "declined"
}
interface MyStory {
  id: string
  slug: string
  title: string
  status: "pending" | "approved" | "declined"
  created_at: string
  reaction_total: number
  story_chapters: Chapter[]
}

const STATUS = {
  pending: { label: "Waiting for review", tone: "bg-[#EAB308]/15 text-[#FDE68A]" },
  approved: { label: "Published", tone: "bg-[#4ADE80]/15 text-[#86EFAC]" },
  declined: { label: "Declined", tone: "bg-[#FCA5A5]/15 text-[#FCA5A5]" },
} as const

const button = `rounded-lg border border-contrast/20 px-3 py-1.5 text-sm font-medium text-contrast hover:border-contrast/40 ${focusRing}`

export default function MyStories() {
  const [writer, setWriter] = useState<Writer | undefined>(undefined)
  const [stories, setStories] = useState<MyStory[] | null>(null)
  const [comments, setComments] = useState<Record<string, number>>({})
  const [message, setMessage] = useState("")

  const load = useCallback(async (w: Writer) => {
    if (!w) return
    const { data } = await w.db
      .from("fan_stories")
      .select("id, slug, title, status, created_at, reaction_total, story_chapters(id, number, title, status)")
      .eq("author_id", w.userId)
      .order("created_at", { ascending: false })
    setStories((data ?? []) as MyStory[])
    const { data: counts } = await w.db.rpc("my_story_comment_counts")
    setComments(Object.fromEntries(((counts ?? []) as { story_id: string; comments: number }[]).map((c) => [c.story_id, Number(c.comments)])))
  }, [])

  useEffect(() => {
    loadWriter().then((w) => {
      setWriter(w)
      load(w)
    })
  }, [load])

  async function withdrawStory(s: MyStory) {
    if (!writer || !window.confirm(`Withdraw "${s.title}"? It's deleted permanently.`)) return
    const { error } = await writer.db.from("fan_stories").delete().eq("id", s.id)
    setMessage(error ? "Couldn't withdraw the story." : `"${s.title}" withdrawn.`)
    load(writer)
  }

  async function withdrawChapter(c: Chapter) {
    if (!writer || !window.confirm(`Withdraw chapter ${c.number}? It's deleted permanently.`)) return
    const { error } = await writer.db.from("story_chapters").delete().eq("id", c.id)
    setMessage(error ? "Couldn't withdraw the chapter." : `Chapter ${c.number} withdrawn.`)
    load(writer)
  }

  if (writer === undefined) return <p className="text-contrast/70">Loading...</p>
  if (!writer || !writer.ready) {
    return (
      <p className="text-contrast/80">
        <Link href="/account?next=/account/stories" className={`rounded-sm font-medium text-contrast underline underline-offset-4 ${focusRing}`}>
          Sign in
        </Link>{" "}
        to see your stories.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-contrast/80">Stories you&apos;ve submitted with this account.</p>
        <Link href="/fanzone/fiction/submit" className={`rounded-lg bg-accent px-5 py-2.5 font-medium text-white ${focusRing}`}>
          Write a story
        </Link>
      </div>
      <p role="status" aria-live="polite" className="min-h-[1.25rem] text-sm text-[#4ADE80]">
        {message}
      </p>
      {stories === null ? (
        <p className="text-contrast/70">Loading your stories...</p>
      ) : stories.length === 0 ? (
        <p className="rounded-2xl border border-contrast/10 p-6 text-contrast/80">You haven&apos;t submitted any stories yet.</p>
      ) : (
        <ul className="space-y-4">
          {stories.map((s) => {
            const chapters = [...s.story_chapters].sort((a, b) => a.number - b.number)
            return (
              <li key={s.id} className="rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-heading text-lg font-bold text-contrast">{s.title}</h2>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-contrast/65">
                      <span className={`rounded-md px-2 py-0.5 font-medium ${STATUS[s.status].tone}`}>{STATUS[s.status].label}</span>
                      <span>Sent {timeAgo(s.created_at)}</span>
                      {s.status === "approved" && (
                        <span>
                          ❤️ {s.reaction_total} reactions · {comments[s.id] ?? 0} comments
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {s.status === "approved" ? (
                      <>
                        <Link href={`/fanzone/fiction/${s.slug}`} className={button} aria-label={`View ${s.title}`}>View</Link>
                        <Link href={`/account/stories/${s.id}/chapter`} aria-label={`Add a chapter to ${s.title}`} className={`rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white ${focusRing}`}>
                          Add a chapter
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href={`/account/stories/${s.id}/edit`} className={button} aria-label={`${s.status === "declined" ? "Fix and resubmit" : "Edit"} ${s.title}`}>
                          {s.status === "declined" ? "Fix and resubmit" : "Edit"}
                        </Link>
                        <button type="button" onClick={() => withdrawStory(s)} className={button} aria-label={`Withdraw ${s.title}`}>
                          Withdraw
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {s.status === "declined" && (
                  <p className="mt-3 text-sm text-contrast/75">An editor didn&apos;t publish this one. Check it against the rules, make changes and resubmit.</p>
                )}
                {chapters.length > 0 && (
                  <ul className="mt-4 divide-y divide-contrast/10 border-t border-contrast/10">
                    {chapters.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                        <span className="text-contrast">
                          Chapter {c.number}
                          {c.title ? `: ${c.title}` : ""}
                          <span className={`ml-2 rounded-md px-2 py-0.5 text-xs ${STATUS[c.status].tone}`}>{STATUS[c.status].label}</span>
                        </span>
                        {c.status !== "approved" && (
                          <span className="flex gap-2">
                            <Link href={`/account/stories/${s.id}/chapter?edit=${c.id}`} className={button} aria-label={`${c.status === "declined" ? "Fix and resubmit" : "Edit"} chapter ${c.number} of ${s.title}`}>
                              {c.status === "declined" ? "Fix and resubmit" : "Edit"}
                            </Link>
                            <button type="button" onClick={() => withdrawChapter(c)} className={button} aria-label={`Withdraw chapter ${c.number} of ${s.title}`}>
                              Withdraw
                            </button>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
