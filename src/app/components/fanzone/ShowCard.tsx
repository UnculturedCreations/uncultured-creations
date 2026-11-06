import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Show, ShowEvent } from "@/lib/realityReloaded"
import Countdown from "./Countdown"
import { StatusPill, focusRing } from "./ui"

// A show on the Reality Reloaded home. Shows marked "coming soon" are not links yet.
export default function ShowCard({ show, nextEvent }: { show: Show; nextEvent?: ShowEvent }) {
  const linked = show.status !== "coming_soon"
  const body = (
    <>
      <span aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-1" style={{ backgroundColor: show.accent_color ?? "#0066FF" }} />
      {show.image_url && (
        // Show images are resized to 1200 x 630 when uploaded.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={show.image_url} alt="" width={1200} height={630} loading="lazy" decoding="async" className="-mx-6 -mt-6 mb-5 aspect-[1200/630] w-[calc(100%+3rem)] max-w-none object-cover" />
      )}
      <div className="flex items-start justify-between gap-3">
        <StatusPill status={show.status} />
        {show.country && <span className="text-xs text-contrast/60">{show.country}</span>}
      </div>
      <h3 className="mt-4 font-heading text-xl font-bold text-contrast">{show.name}</h3>
      {show.tagline && <p className="mt-2 text-sm leading-relaxed text-contrast/75">{show.tagline}</p>}
      {nextEvent && (
        <p className="mt-4 text-sm">
          <span className="block text-contrast/60">{nextEvent.title}</span>
          <Countdown startsAt={nextEvent.starts_at} />
        </p>
      )}
      {linked && (
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-contrast">
          Enter
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
        </span>
      )}
    </>
  )

  const base = "relative flex h-full flex-col overflow-hidden rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-6"
  return linked ? (
    <Link
      href={`/fanzone/${show.slug}`}
      className={`group ${base} transition-colors hover:border-contrast/25 hover:bg-contrast/[0.06] motion-reduce:transition-none ${focusRing}`}
    >
      {body}
    </Link>
  ) : (
    <div className={`${base} opacity-80`}>{body}</div>
  )
}
