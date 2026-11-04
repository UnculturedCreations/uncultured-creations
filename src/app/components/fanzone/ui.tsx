import type { HousemateStatus, PostKind, ShowStatus } from "@/lib/realityReloaded"

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"

export const STATUS_LABEL: Record<ShowStatus, string> = {
  live: "On air",
  upcoming: "Starting soon",
  off_season: "Between seasons",
  coming_soon: "Coming soon",
}

export const KIND_LABEL: Record<PostKind, string> = {
  news: "News",
  gossip: "Gossip",
  trending: "Trending",
  recap: "Recap",
  scenario: "What could happen",
}

export function StatusPill({ status }: { status: ShowStatus }) {
  const live = status === "live"
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-contrast/15 px-3 py-1 text-xs text-contrast/85">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${live ? "bg-accent" : "bg-contrast/40"}`} />
      {STATUS_LABEL[status]}
    </span>
  )
}

export function KindBadge({ kind }: { kind: PostKind }) {
  return (
    <span className="rounded-md bg-contrast/10 px-2 py-0.5 text-xs font-medium text-contrast/85">
      {KIND_LABEL[kind]}
    </span>
  )
}

// Show tag, coloured with the show's accent as a small swatch (text stays high-contrast).
export function ShowTag({ name, accent }: { name: string; accent: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-contrast/75">
      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: accent ?? "#0066FF" }} />
      {name}
    </span>
  )
}

function initials(name: string) {
  const words = name.trim().split(/\s+/)
  const first = words[0]?.[0] ?? ""
  const last = words.length > 1 ? words[words.length - 1][0] : ""
  return (first + last).toUpperCase()
}

// Choose dark or light text for legibility on a given background colour.
function textOn(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.35 ? "#121212" : "#FFFFFF"
}

// Housemates are shown as coloured initials, never photos (photos belong to the shows).
export function HousemateAvatar({
  name,
  color,
  size = "md",
  dimmed = false,
}: {
  name: string
  color: string | null
  size?: "sm" | "md"
  dimmed?: boolean
}) {
  const bg = color ?? "#3D85FF"
  const dims = size === "sm" ? "h-8 w-8 text-xs" : "h-12 w-12 text-sm"
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-full font-heading font-bold ${dims} ${dimmed ? "opacity-50 grayscale" : ""}`}
      style={{ backgroundColor: bg, color: textOn(bg) }}
    >
      {initials(name)}
    </span>
  )
}

export function housemateStatusLabel(status: HousemateStatus, exitWeek: number | null) {
  switch (status) {
    case "in_house":
      return "In the house"
    case "evicted":
      return exitWeek ? `Evicted in week ${exitWeek}` : "Evicted"
    case "walked":
      return "Left the house"
    case "disqualified":
      return "Disqualified"
    case "winner":
      return "Winner"
  }
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

// Rendered on the server; pages refresh every minute, so this stays close enough.
export function timeAgo(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return "just now"
}

export function SectionHeading({ id, title, intro }: { id: string; title: string; intro?: string }) {
  return (
    <div className="mb-6">
      <h2 id={id} className="font-heading text-2xl font-bold text-contrast sm:text-3xl">
        {title}
      </h2>
      {intro && <p className="mt-2 max-w-prose text-contrast/70">{intro}</p>}
    </div>
  )
}

export function FanSiteNote() {
  return (
    <p className="mx-auto max-w-6xl px-4 pb-10 text-xs text-contrast/55 sm:px-6">
      Reality Reloaded is an independent fan site. It is not affiliated with, endorsed by or connected to any
      show, broadcaster or production company. Show names belong to their owners.
    </p>
  )
}
