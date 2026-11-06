"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, RefreshCw, Share2 } from "lucide-react"
import type { BingoCard as Card } from "@/lib/realityReloaded"
import { FREE, buildCard, completedLines } from "./bingo"
import { drawBingoImage } from "./bingoShare"
import { focusRing } from "./ui"

interface Saved {
  seed: number
  marked: string[] // ticked moments, by text, so editing the list later doesn't scramble ticks
}

const key = (id: string) => `rr-bingo:${id}`
const newSeed = () => Math.floor(Math.random() * 2 ** 31)

function load(id: string): Saved | null {
  try {
    return JSON.parse(localStorage.getItem(key(id)) ?? "null")
  } catch {
    return null
  }
}
function save(id: string, value: Saved) {
  try {
    localStorage.setItem(key(id), JSON.stringify(value))
  } catch {}
}

export default function BingoCard({ card, showName, showSlug }: { card: Card; showName: string; showSlug: string }) {
  const [state, setState] = useState<Saved | null>(null)
  const [message, setMessage] = useState("")
  const [sharing, setSharing] = useState(false)

  // Each fan's card is shuffled in their own browser, and remembered there.
  useEffect(() => {
    const saved = load(card.id)
    const initial = saved ?? { seed: newSeed(), marked: [] }
    setState(initial)
    if (!saved) save(card.id, initial)
  }, [card.id])

  const squares = useMemo(() => (state ? buildCard(card.items, card.size, state.seed) : []), [card.items, card.size, state])
  const ticked = squares.map((s) => s === FREE || (state?.marked.includes(s) ?? false))
  const won = completedLines(card.size, ticked)
  const winning = new Set(won.flat())
  const tickCount = ticked.filter(Boolean).length - (card.size === 5 ? 1 : 0)
  const total = squares.length - (card.size === 5 ? 1 : 0)
  const [celebrated, setCelebrated] = useState(0)

  useEffect(() => {
    if (won.length > celebrated) setMessage(won.length === 1 ? "BINGO! You completed a line." : `BINGO! ${won.length} lines complete.`)
    setCelebrated(won.length)
  }, [won.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(text: string) {
    if (!state || text === FREE) return
    const marked = state.marked.includes(text) ? state.marked.filter((m) => m !== text) : [...state.marked, text]
    const next = { ...state, marked }
    setState(next)
    save(card.id, next)
  }

  function clear() {
    if (!state) return
    const next = { ...state, marked: [] }
    setState(next)
    save(card.id, next)
    setMessage("Ticks cleared.")
  }

  function shuffle() {
    if (state && state.marked.length > 0 && !window.confirm("Get a new card? Your ticks will be cleared.")) return
    const next = { seed: newSeed(), marked: [] }
    setState(next)
    save(card.id, next)
    setMessage("New card ready.")
  }

  async function share() {
    setSharing(true)
    try {
      const url = `${window.location.origin}/fanzone/${showSlug}`
      const blob = await drawBingoImage({ title: card.title, showName, size: card.size, squares, ticked, winning, bingo: won.length > 0, url })
      const file = new File([blob], "my-bingo-card.png", { type: "image/png" })
      const text = won.length > 0 ? `BINGO! ${card.title}, ${showName}. Play along:` : `My ${card.title} card for ${showName}. Play along:`
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${text} ${url}` })
      } else {
        // Desktop browsers without file sharing: download the image instead.
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = file.name
        a.click()
        URL.revokeObjectURL(a.href)
        setMessage("Image downloaded. Post it with your score!")
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setMessage("Couldn't create the image. Please try again.")
    } finally {
      setSharing(false)
    }
  }

  const button = `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${focusRing}`

  return (
    <article className="rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-heading text-lg font-bold text-contrast">{card.title}</h3>
        {state && (
          <span className="text-xs text-contrast/65">
            {tickCount} of {total} ticked{won.length > 0 && ` · ${won.length} ${won.length === 1 ? "line" : "lines"}`}
          </span>
        )}
      </div>
      {card.description && <p className="mt-1 text-sm text-contrast/75">{card.description}</p>}
      <p className="mt-1 text-xs text-contrast/60">Tap a square when it happens. Complete a row, column or diagonal for BINGO.</p>

      <div className="relative mt-4">
        <div
          role="group"
          aria-label={`${card.title} bingo card`}
          className={`grid gap-1.5 sm:gap-2 ${card.size === 5 ? "grid-cols-5" : "grid-cols-4"}`}
        >
          {state
            ? squares.map((text, i) => {
                const on = ticked[i]
                const free = text === FREE
                return (
                  <button
                    key={`${text}-${i}`}
                    type="button"
                    onClick={() => toggle(text)}
                    aria-pressed={on}
                    disabled={free}
                    className={`relative flex aspect-square items-center justify-center rounded-lg p-1 text-center leading-tight transition-colors motion-reduce:transition-none sm:rounded-xl sm:p-2 ${
                      card.size === 5 ? "text-[10px] sm:text-xs" : "text-[11px] sm:text-sm"
                    } ${focusRing} ${
                      on ? "bg-gradient-to-br from-accent to-secondary font-medium text-white" : "border border-contrast/15 text-contrast/90 hover:border-contrast/35"
                    } ${winning.has(i) ? "ring-2 ring-contrast" : ""}`}
                  >
                    {free ? <span className="font-heading text-sm font-bold sm:text-[1rem]">FREE</span> : text}
                    {on && !free && <Check className="absolute right-1 top-1 h-3 w-3 opacity-80" aria-hidden="true" />}
                  </button>
                )
              })
            : [...Array(card.size * card.size)].map((_, i) => <div key={i} aria-hidden="true" className="aspect-square rounded-lg bg-contrast/[0.04]" />)}
        </div>
        {won.length > 0 && (
          <p aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 flex justify-center">
            <span className="animate-bounce rounded-full bg-contrast px-4 py-1 font-heading text-lg font-bold text-[#121212] motion-reduce:animate-none">BINGO!</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={share} disabled={!state || sharing} className={`${button} bg-accent text-white disabled:opacity-50`}>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          {sharing ? "Creating image..." : "Share my card"}
        </button>
        <button type="button" onClick={clear} disabled={!state || state.marked.length === 0} className={`${button} border border-contrast/20 text-contrast disabled:opacity-50`}>
          Clear ticks
        </button>
        <button type="button" onClick={shuffle} disabled={!state} className={`${button} border border-contrast/20 text-contrast disabled:opacity-50`}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          New card
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-[1.25rem] text-sm font-medium text-contrast">
        {message}
      </p>
    </article>
  )
}
