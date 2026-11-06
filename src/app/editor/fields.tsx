"use client"

import { useCallback, useEffect, useId, useState, type ReactNode } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"

// Shared building blocks for the editor forms.

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
const control = `w-full rounded-lg border border-contrast/20 bg-base px-3 py-2 text-sm text-contrast placeholder:text-contrast/40 ${focusRing}`

export function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-contrast">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1 text-xs text-contrast/60">{hint}</p>}
    </div>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={control} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={control} />
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={control}>
      {children}
    </select>
  )
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const styles = {
    primary: "bg-accent text-white hover:bg-accent/85",
    secondary: "border border-contrast/20 text-contrast hover:border-contrast/40",
    danger: "border border-[#FCA5A5]/40 text-[#FCA5A5] hover:border-[#FCA5A5]",
  }[variant]
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 motion-reduce:transition-none ${styles} ${focusRing} ${className}`}
    />
  )
}

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-5">{children}</div>
}

// One status line per panel, announced to screen readers.
export function useNotice() {
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null)
  const ok = useCallback((text: string) => setNotice({ kind: "ok", text }), [])
  const fail = useCallback((text: string, error?: { message?: string } | null) => {
    if (error) console.error(text, error)
    setNotice({ kind: "error", text: error?.message ? `${text} (${error.message})` : text })
  }, [])
  const node = (
    <p role="status" aria-live="polite" className={`min-h-[1.25rem] text-sm ${notice?.kind === "error" ? "text-[#FCA5A5]" : "text-[#4ADE80]"}`}>
      {notice?.text}
    </p>
  )
  return { ok, fail, clear: () => setNotice(null), node }
}

export interface EditorShow {
  id: string
  slug: string
  name: string
  short_name: string | null
  status: string
  tagline: string | null
  country: string | null
  accent_color: string | null
  cast_singular: string
  cast_plural: string
  venue: "house" | "villa"
  image_url: string | null
}

export function useShows(db: SupabaseClient) {
  const [shows, setShows] = useState<EditorShow[]>([])
  const reload = useCallback(async () => {
    const { data } = await db.from("shows").select("id, slug, name, short_name, status, tagline, country, accent_color, cast_singular, cast_plural, venue, image_url").order("sort_order")
    setShows((data ?? []) as EditorShow[])
  }, [db])
  useEffect(() => {
    reload()
  }, [reload])
  return { shows, reload }
}

export interface EditorHousemate {
  id: string
  name: string
  status: string
}

// Current season and its housemates for a show (used to link poll options to housemates).
export async function currentSeason(db: SupabaseClient, showId: string) {
  const { data: season } = await db.from("seasons").select("id, name").eq("show_id", showId).eq("is_current", true).maybeSingle()
  if (!season) return { season: null, housemates: [] as EditorHousemate[] }
  const { data: housemates } = await db.from("housemates").select("id, name, status").eq("season_id", season.id).order("sort_order")
  return { season: season as { id: string; name: string }, housemates: (housemates ?? []) as EditorHousemate[] }
}

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : ""

// Shrink an uploaded image to a small centred square JPEG before it leaves the browser,
// so housemate images stay tiny (about 20-40 KB) however large the original is.
export async function toSquareJpeg(file: File, size = 320): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas unavailable")
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  bitmap.close()
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process image"))), "image/jpeg", 0.85))
}

// Crop an image to fill a fixed shape (e.g. 1200 x 630 for link previews) and compress it.
export async function toCoverJpeg(file: File, width: number, height: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.max(width / bitmap.width, height / bitmap.height)
  const sw = width / scale
  const sh = height / scale
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas unavailable")
  ctx.drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, width, height)
  bitmap.close()
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process image"))), "image/jpeg", 0.82))
}

// URL-friendly words from a title, plus a short random suffix so addresses never clash.
export function storySlug(title: string) {
  const words = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "")
  const suffix = Math.random().toString(36).slice(2, 8)
  return words ? `${words}-${suffix}` : suffix
}
