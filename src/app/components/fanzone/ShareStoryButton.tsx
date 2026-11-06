"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { drawStoryShare } from "./storyShare"
import { focusRing } from "./ui"

export default function ShareStoryButton(props: { title: string; penName: string; showName: string | null; accent: string | null; coverUrl: string | null }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  async function share() {
    setBusy(true)
    setMessage("")
    try {
      const url = window.location.href.split("#")[0]
      // If the browser won't let us reuse the cover image, use the automatic cover design instead.
      const blob = await drawStoryShare({ ...props, url }).catch(() => drawStoryShare({ ...props, coverUrl: null, url }))
      const file = new File([blob], "fan-fiction.png", { type: "image/png" })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `"${props.title}" by ${props.penName}. Read it on Reality Reloaded: ${url}` })
      } else {
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = file.name
        a.click()
        URL.revokeObjectURL(a.href)
        setMessage("Image downloaded. Post it with a link to the story!")
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setMessage("Couldn't create the image. Please try again.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div>
      <button type="button" onClick={share} disabled={busy} className={`inline-flex items-center gap-2 rounded-lg border border-contrast/20 px-4 py-2 text-sm font-medium text-contrast hover:border-contrast/40 disabled:opacity-50 ${focusRing}`}>
        <Share2 className="h-4 w-4" aria-hidden="true" />
        {busy ? "Creating image..." : "Share story"}
      </button>
      <p role="status" aria-live="polite" className="mt-1 min-h-[1.25rem] text-sm text-contrast/75">
        {message}
      </p>
    </div>
  )
}
