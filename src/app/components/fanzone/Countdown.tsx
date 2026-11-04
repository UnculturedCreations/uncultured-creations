"use client"

import { useEffect, useState } from "react"

function formatRemaining(ms: number) {
  if (ms <= 0) return "Happening now"
  const minutes = Math.floor(ms / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return `in ${days}d ${hours}h`
  if (hours > 0) return `in ${hours}h ${mins}m`
  return `in ${Math.max(mins, 1)}m`
}

// Shows the event time and a countdown. The first render matches the server
// (date only, in UTC), then switches to the visitor's local time after mounting.
export default function Countdown({ startsAt }: { startsAt: string }) {
  const target = new Date(startsAt).getTime()
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  const when =
    now === null
      ? new Date(startsAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
      : new Date(startsAt).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })

  return (
    <span className="text-sm text-contrast/75">
      <time dateTime={startsAt}>{when}</time>
      {now !== null && <span className="ml-2 font-medium text-contrast">{formatRemaining(target - now)}</span>}
    </span>
  )
}
