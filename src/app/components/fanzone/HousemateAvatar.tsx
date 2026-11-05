"use client"

import { useEffect, useRef, useState } from "react"

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

// Shows an editor-uploaded image when there is one, otherwise (or if it fails to load) coloured initials.
export default function HousemateAvatar({
  name,
  color,
  imageUrl,
  size = "md",
  dimmed = false,
}: {
  name: string
  color: string | null
  imageUrl?: string | null
  size?: "sm" | "md"
  dimmed?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // An image can fail before React is ready in the browser, so its error event is missed.
  // Check once on mount: a finished image with no width failed to load.
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth === 0) setFailed(true)
  }, [imageUrl])
  const bg = color ?? "#3D85FF"
  const dims = size === "sm" ? "h-8 w-8 text-xs" : "h-12 w-12 text-sm"
  const px = size === "sm" ? 32 : 48
  const fade = dimmed ? "opacity-50 grayscale" : ""
  if (imageUrl && !failed) {
    return (
      // Images are already resized to a small square when uploaded, so a plain <img> is the lightest option.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={imgRef}
        src={imageUrl}
        alt=""
        width={px}
        height={px}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full object-cover ${dims} ${fade}`}
        style={{ backgroundColor: bg }}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-full font-heading font-bold ${dims} ${fade}`}
      style={{ backgroundColor: bg, color: textOn(bg) }}
    >
      {initials(name)}
    </span>
  )
}
