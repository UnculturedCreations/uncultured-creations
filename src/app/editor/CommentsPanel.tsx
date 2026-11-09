"use client"

import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button, Card, formatDate, useNotice } from "./fields"

interface ModComment {
  id: string
  body: string
  status: "visible" | "hidden"
  report_count: number
  created_at: string
  user_id: string
  fan_name: string
  can_comment: boolean
  story_title: string
  story_slug: string
}

export default function CommentsPanel({ db }: { db: SupabaseClient }) {
  const { ok, fail, node } = useNotice()
  const [reportedOnly, setReportedOnly] = useState(true)
  const [rows, setRows] = useState<ModComment[] | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await db.rpc("moderation_comments", { p_only_reported: reportedOnly })
    if (error) fail("Couldn't load comments.", error)
    setRows((data ?? []) as ModComment[])
  }, [db, fail, reportedOnly])

  useEffect(() => {
    load()
  }, [load])

  async function restore(c: ModComment) {
    const { error } = await db.from("story_comments").update({ status: "visible", report_count: 0 }).eq("id", c.id)
    if (error) return fail("Couldn't restore the comment.", error)
    await db.from("comment_reports").delete().eq("comment_id", c.id)
    ok("Comment restored and its reports cleared.")
    load()
  }

  async function remove(c: ModComment) {
    if (!window.confirm(`Delete this comment by ${c.fan_name}? This can't be undone.`)) return
    const { error } = await db.from("story_comments").delete().eq("id", c.id)
    if (error) return fail("Couldn't delete the comment.", error)
    ok("Comment deleted.")
    load()
  }

  async function setCommenting(c: ModComment, allowed: boolean) {
    if (!allowed && !window.confirm(`Turn off commenting for ${c.fan_name}? Their existing comments stay unless you delete them.`)) return
    const { data, error } = await db.rpc("set_can_comment", { p_user_id: c.user_id, p_allowed: allowed })
    if (error || data !== "ok") return fail("Couldn't change commenting for this fan.", error)
    ok(allowed ? `${c.fan_name} can comment again.` : `Commenting turned off for ${c.fan_name}.`)
    load()
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">Comments</h2>
        <p className="mt-1 text-sm text-contrast/70">
          Comments appear straight away. A comment reported by three different fans is hidden until you review it here.
        </p>
        <div role="group" aria-label="Show comments" className="mt-4 flex flex-wrap gap-2">
          <Button variant={reportedOnly ? "primary" : "secondary"} aria-pressed={reportedOnly} onClick={() => setReportedOnly(true)}>
            Reported and hidden
          </Button>
          <Button variant={!reportedOnly ? "primary" : "secondary"} aria-pressed={!reportedOnly} onClick={() => setReportedOnly(false)}>
            All recent
          </Button>
        </div>
        <div className="mt-3">{node}</div>
      </Card>

      <Card>
        {rows === null ? (
          <p className="text-sm text-contrast/70">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-contrast/70">{reportedOnly ? "Nothing reported. All quiet." : "No comments yet."}</p>
        ) : (
          <ul className="divide-y divide-contrast/10">
            {rows.map((c) => (
              <li key={c.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium text-contrast">{c.fan_name}</span>
                      {!c.can_comment && <span className="ml-2 rounded-md bg-[#FCA5A5]/15 px-2 py-0.5 text-xs text-[#FCA5A5]">Commenting off</span>}
                    </p>
                    <p className="text-xs text-contrast/60">
                      on{" "}
                      <a href={`/fanzone/fiction/${c.story_slug}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-contrast">
                        {c.story_title}
                      </a>{" "}
                      · {formatDate(c.created_at)}
                      {c.status === "hidden" && " · Hidden"}
                      {c.report_count > 0 && ` · ${c.report_count} ${c.report_count === 1 ? "report" : "reports"}`}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm text-contrast/90">{c.body}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(c.status === "hidden" || c.report_count > 0) && (
                      <Button variant="secondary" onClick={() => restore(c)} aria-label={`Restore comment by ${c.fan_name}`}>
                        Restore
                      </Button>
                    )}
                    <Button variant="danger" onClick={() => remove(c)} aria-label={`Delete comment by ${c.fan_name}`}>
                      Delete
                    </Button>
                    <Button variant="secondary" onClick={() => setCommenting(c, !c.can_comment)} aria-label={`${c.can_comment ? "Turn off" : "Turn on"} commenting for ${c.fan_name}`}>
                      {c.can_comment ? "Turn off commenting" : "Allow commenting"}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
