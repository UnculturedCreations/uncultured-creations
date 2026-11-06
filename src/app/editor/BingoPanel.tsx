"use client"

import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button, Card, Field, Select, TextInput, useNotice, useShows } from "./fields"

interface BingoRow {
  id: string
  show_id: string
  title: string
  description: string | null
  size: 4 | 5
  items: string[]
  status: "draft" | "published"
  published_at: string | null
  is_sample: boolean
}

// A starting point that suits most live shows; edit freely.
const STARTER = [
  "Someone cries",
  "The host throws shade",
  "A surprise twist is announced",
  "Saved at the very last second",
  "A standing ovation",
  "An awkward silence",
  "Someone says “I’m here to win”",
  "A fan favourite is evicted",
  "Someone hugs their rival",
  "A shock exit",
  "The audience boos",
  "Someone forgets a name",
  "A heated argument",
  "A secret is revealed",
  "Someone thanks God first",
  "A new romance hint",
  "Someone shouts out their fanbase",
  "A dramatic outfit",
  "The host repeats a question",
  "Someone says “no regrets”",
  "A double eviction",
  "Someone is speechless",
  "A tearful goodbye speech",
  "The lights go dramatic",
  "Someone walks off without hugging anyone",
  "A sponsor shout-out",
  "A housemate predicts the result",
  "Someone dances on stage",
]

const EMPTY = { id: "", show_id: "", title: "Eviction-night bingo", description: "", size: 4 as 4 | 5, moments: "" }

const parseMoments = (text: string) => [...new Set(text.split("\n").map((m) => m.trim()).filter(Boolean))]

export default function BingoPanel({ db, userId }: { db: SupabaseClient; userId: string }) {
  const { shows } = useShows(db)
  const { ok, fail, clear, node } = useNotice()
  const [cards, setCards] = useState<BingoRow[]>([])
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!form.show_id && shows[0]) setForm((f) => ({ ...f, show_id: shows[0].id }))
  }, [shows, form.show_id])

  const load = useCallback(async () => {
    const { data, error } = await db
      .from("bingo_cards")
      .select("id, show_id, title, description, size, items, status, published_at, is_sample")
      .order("created_at", { ascending: false })
    if (error) fail("Couldn't load bingo cards.", error)
    setCards((data ?? []) as BingoRow[])
  }, [db, fail])

  useEffect(() => {
    load()
  }, [load])

  const moments = parseMoments(form.moments)
  const needed = form.size === 5 ? 24 : 16
  const tooLong = moments.filter((m) => m.length > 60)

  async function save(publish: boolean) {
    clear()
    if (!form.show_id) return fail("Choose a show.")
    if (!form.title.trim()) return fail("Give the card a title.")
    if (tooLong.length) return fail(`Keep each moment to 60 characters or fewer (${tooLong.length} too long).`)
    if (moments.length < needed) return fail(`A ${form.size} x ${form.size} card needs at least ${needed} different moments; you have ${moments.length}.`)
    if (moments.length > 80) return fail("Use 80 moments or fewer.")
    setBusy(true)
    const existing = cards.find((c) => c.id === form.id)
    const row = {
      show_id: form.show_id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      size: form.size,
      items: moments,
      status: publish ? "published" : "draft",
      published_at: publish ? (existing?.published_at ?? new Date().toISOString()) : null,
    }
    const { error } = form.id ? await db.from("bingo_cards").update(row).eq("id", form.id) : await db.from("bingo_cards").insert({ ...row, created_by: userId })
    setBusy(false)
    if (error) return fail("Couldn't save the card.", error)
    ok(publish ? "Published. It appears on the show page within a minute." : "Saved as a draft.")
    setForm({ ...EMPTY, show_id: form.show_id })
    load()
  }

  async function setStatus(card: BingoRow, publish: boolean) {
    const { error } = await db
      .from("bingo_cards")
      .update({ status: publish ? "published" : "draft", published_at: publish ? (card.published_at ?? new Date().toISOString()) : null })
      .eq("id", card.id)
    if (error) return fail("Couldn't update the card.", error)
    ok(publish ? "Published." : "Moved to drafts.")
    load()
  }

  async function remove(card: BingoRow) {
    if (!window.confirm(`Delete "${card.title}"? This can't be undone.`)) return
    const { error } = await db.from("bingo_cards").delete().eq("id", card.id)
    if (error) return fail("Couldn't delete the card.", error)
    ok("Card deleted.")
    if (form.id === card.id) setForm({ ...EMPTY, show_id: form.show_id })
    load()
  }

  function edit(card: BingoRow) {
    setForm({ id: card.id, show_id: card.show_id, title: card.title, description: card.description ?? "", size: card.size, moments: card.items.join("\n") })
    clear()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const showName = (id: string) => shows.find((s) => s.id === id)?.short_name ?? shows.find((s) => s.id === id)?.name ?? ""

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">{form.id ? "Edit bingo card" : "New bingo card"}</h2>
        <p className="mt-1 text-sm text-contrast/70">
          Each fan gets their own shuffled card from your moments. Add more moments than the card needs and fans&apos; cards will differ.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Show">
            {(id) => (
              <Select id={id} value={form.show_id} onChange={(e) => setForm({ ...form, show_id: e.target.value })}>
                {shows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Title">{(id) => <TextInput id={id} value={form.title} maxLength={80} onChange={(e) => setForm({ ...form, title: e.target.value })} />}</Field>
          <div className="sm:col-span-2">
            <Field label="Short description (optional)">
              {(id) => <TextInput id={id} value={form.description} maxLength={200} placeholder="For example: for Sunday's live eviction show" onChange={(e) => setForm({ ...form, description: e.target.value })} />}
            </Field>
          </div>
        </div>
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium text-contrast">Card size</legend>
          <div className="flex flex-wrap gap-4 text-sm text-contrast">
            {([4, 5] as const).map((n) => (
              <label key={n} className="flex items-center gap-2">
                <input type="radio" name="bingo-size" checked={form.size === n} onChange={() => setForm({ ...form, size: n })} className="h-4 w-4 accent-[#0066FF]" />
                {n === 4 ? "4 x 4 (16 squares, easier on phones)" : "5 x 5 (24 squares plus a free centre)"}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-4">
          <Field label="Moments, one per line" hint={`${moments.length} moments (at least ${needed} needed). Duplicates are ignored. Up to 60 characters each.`}>
            {(id) => (
              <textarea
                id={id}
                rows={10}
                value={form.moments}
                onChange={(e) => setForm({ ...form, moments: e.target.value })}
                className="w-full rounded-lg border border-contrast/20 bg-base px-3 py-2 text-sm text-contrast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              />
            )}
          </Field>
          <Button variant="secondary" className="mt-2" onClick={() => setForm({ ...form, moments: [...new Set([...moments, ...STARTER])].join("\n") })}>
            Use starter moments
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => save(true)} disabled={busy}>
            Publish
          </Button>
          <Button variant="secondary" onClick={() => save(false)} disabled={busy}>
            Save as draft
          </Button>
          {form.id && (
            <Button variant="secondary" onClick={() => setForm({ ...EMPTY, show_id: form.show_id })}>
              Cancel editing
            </Button>
          )}
        </div>
        <div className="mt-3">{node}</div>
      </Card>

      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">Bingo cards</h2>
        {cards.length === 0 ? (
          <p className="mt-3 text-sm text-contrast/70">No bingo cards yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-contrast/10">
            {cards.map((card) => (
              <li key={card.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-contrast">{card.title}</p>
                  <p className="text-xs text-contrast/60">
                    {card.status === "published" ? "Published" : "Draft"} · {showName(card.show_id)} · {card.size} x {card.size} · {card.items.length} moments
                    {card.is_sample && " · Sample"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => edit(card)} aria-label={`Edit ${card.title}`}>
                    Edit
                  </Button>
                  <Button variant="secondary" onClick={() => setStatus(card, card.status !== "published")} aria-label={`${card.status === "published" ? "Unpublish" : "Publish"} ${card.title}`}>
                    {card.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="danger" onClick={() => remove(card)} aria-label={`Delete ${card.title}`}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
