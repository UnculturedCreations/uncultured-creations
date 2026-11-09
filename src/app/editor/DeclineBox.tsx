"use client"

import { useId, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { DECLINE_REASONS } from "@/app/components/fanzone/fanFiction"
import { Button } from "./fields"

// Declining needs at least one reason or a note, so the writer knows what to fix.
export default function DeclineBox({
  db,
  userId,
  storyId,
  chapterId,
  onDone,
  onCancel,
}: {
  db: SupabaseClient
  userId: string
  storyId: string
  chapterId?: string
  onDone: (error: { message?: string } | null) => void
  onCancel: () => void
}) {
  const id = useId()
  const [reasons, setReasons] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [problem, setProblem] = useState("")
  const [busy, setBusy] = useState(false)

  async function decline() {
    if (reasons.length === 0 && note.trim().length < 10) return setProblem("Tick a reason or write a note (at least 10 characters) so the writer knows what to change.")
    if (reasons.includes("other") && note.trim().length < 10) return setProblem("You ticked “Something else”: please explain in the note.")
    setBusy(true)
    const { error: noteError } = await db.from("review_notes").insert({ story_id: storyId, chapter_id: chapterId ?? null, reasons, note: note.trim() || null, created_by: userId })
    if (noteError) {
      setBusy(false)
      return onDone(noteError)
    }
    const { error } = chapterId
      ? await db.from("story_chapters").update({ status: "declined", published_at: null, reviewed_by: userId }).eq("id", chapterId)
      : await db.from("fan_stories").update({ status: "declined", published_at: null, reviewed_by: userId }).eq("id", storyId)
    setBusy(false)
    onDone(error)
  }

  return (
    <fieldset className="mt-3 rounded-xl border border-[#FCA5A5]/30 p-4">
      <legend className="px-1 text-sm font-medium text-contrast">Why isn&apos;t it being published? The writer sees this.</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {DECLINE_REASONS.map((r) => (
          <label key={r.value} className="flex items-start gap-2 text-sm text-contrast">
            <input
              type="checkbox"
              checked={reasons.includes(r.value)}
              onChange={() => setReasons(reasons.includes(r.value) ? reasons.filter((x) => x !== r.value) : [...reasons, r.value])}
              className="mt-0.5 h-4 w-4 accent-[#FCA5A5]"
            />
            {r.label}
          </label>
        ))}
      </div>
      <label htmlFor={`${id}-note`} className="mb-1 mt-4 block text-sm font-medium text-contrast">
        Note to the writer
      </label>
      <textarea
        id={`${id}-note`}
        rows={3}
        maxLength={1000}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="For example: the second half names a real housemate's family member. Please remove that and resubmit."
        className="w-full rounded-lg border border-contrast/20 bg-base px-3 py-2 text-sm text-contrast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
      {problem && <p role="alert" className="mt-2 text-sm text-[#FCA5A5]">{problem}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="danger" onClick={decline} disabled={busy}>
          {busy ? "Declining..." : "Decline and send note"}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </fieldset>
  )
}
