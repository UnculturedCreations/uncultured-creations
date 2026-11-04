import { supabase } from "@/lib/supabase"

// Reality Reloaded data access. Every function returns safe empty values when
// the database is unreachable, so pages degrade gracefully instead of crashing.

// Sample rows (is_sample = true) are fictional placeholders. They show in
// previews and local development only when NEXT_PUBLIC_SHOW_SAMPLE_DATA=true;
// production leaves the variable unset, so visitors never see them.
const SHOW_SAMPLES = process.env.NEXT_PUBLIC_SHOW_SAMPLE_DATA === "true"

export type ShowStatus = "live" | "upcoming" | "off_season" | "coming_soon"
export type PostKind = "news" | "gossip" | "trending" | "recap" | "scenario"
export type HousemateStatus = "in_house" | "evicted" | "walked" | "disqualified" | "winner"

export interface Show {
  id: string
  slug: string
  name: string
  short_name: string | null
  country: string | null
  status: ShowStatus
  tagline: string | null
  accent_color: string | null
}

export interface ShowRef {
  slug: string
  name: string
  short_name: string | null
  accent_color: string | null
}

export interface Post {
  id: string
  kind: PostKind
  title: string
  summary: string | null
  source_name: string | null
  source_url: string | null
  published_at: string
  show: ShowRef | null
}

export interface ShowEvent {
  id: string
  title: string
  kind: string
  starts_at: string
  show: ShowRef | null
}

export interface Season {
  id: string
  name: string
  starts_on: string | null
  ends_on: string | null
  winner_name: string | null
}

export interface Housemate {
  id: string
  name: string
  color: string | null
  status: HousemateStatus
  exit_week: number | null
}

export interface RankingEntry {
  value: number
  housemate: Housemate
}

export interface RankingCategory {
  id: string
  name: string
  description: string | null
  higher_is_better: boolean
  entries: RankingEntry[]
}

const SHOW_FIELDS = "id, slug, name, short_name, country, status, tagline, accent_color"
const SHOW_REF = "show:shows(slug, name, short_name, accent_color)"
const POST_FIELDS = `id, kind, title, summary, source_name, source_url, published_at, ${SHOW_REF}`

function report(where: string, error: unknown) {
  if (error) console.error(`[realityReloaded] ${where}:`, error)
}

export async function getShows(): Promise<Show[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from("shows").select(SHOW_FIELDS).order("sort_order")
  report("getShows", error)
  if (error) return null
  return (data ?? []) as Show[]
}

// available = false means the database could not be reached (not "no such show").
export async function getShowBySlug(slug: string): Promise<{ show: Show | null; available: boolean }> {
  if (!supabase) return { show: null, available: false }
  const { data, error } = await supabase.from("shows").select(SHOW_FIELDS).eq("slug", slug).maybeSingle()
  report("getShowBySlug", error)
  if (error) return { show: null, available: false }
  return { show: (data as Show | null) ?? null, available: true }
}

// Latest news, gossip and trending posts across every show (and general posts).
export async function getTopStories(limit = 6): Promise<Post[]> {
  if (!supabase) return []
  let query = supabase
    .from("posts")
    .select(POST_FIELDS)
    .in("kind", ["news", "gossip", "trending"])
    .order("published_at", { ascending: false })
    .limit(limit)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  const { data, error } = await query
  report("getTopStories", error)
  return (data ?? []) as unknown as Post[]
}

export async function getShowPosts(showId: string, limit = 12): Promise<Post[]> {
  if (!supabase) return []
  let query = supabase
    .from("posts")
    .select(POST_FIELDS)
    .eq("show_id", showId)
    .order("published_at", { ascending: false })
    .limit(limit)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  const { data, error } = await query
  report("getShowPosts", error)
  return (data ?? []) as unknown as Post[]
}

// The next scheduled event for each show (or for one show when showId is given).
export async function getUpcomingEvents(showId?: string): Promise<ShowEvent[]> {
  if (!supabase) return []
  let query = supabase
    .from("show_events")
    .select(`id, title, kind, starts_at, show_id, ${SHOW_REF}`)
    .gt("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(20)
  if (showId) query = query.eq("show_id", showId)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  const { data, error } = await query
  report("getUpcomingEvents", error)
  const rows = (data ?? []) as unknown as (ShowEvent & { show_id: string })[]
  const firstPerShow = new Map<string, ShowEvent>()
  for (const row of rows) if (!firstPerShow.has(row.show_id)) firstPerShow.set(row.show_id, row)
  return [...firstPerShow.values()]
}

export async function getCurrentSeason(showId: string): Promise<Season | null> {
  if (!supabase) return null
  let query = supabase
    .from("seasons")
    .select("id, name, starts_on, ends_on, winner_name")
    .eq("show_id", showId)
    .eq("is_current", true)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  const { data, error } = await query.maybeSingle()
  report("getCurrentSeason", error)
  return (data as Season | null) ?? null
}

// Most recent season with a recorded winner, for the between-seasons view.
export async function getLatestWinner(showId: string): Promise<Season | null> {
  if (!supabase) return null
  let query = supabase
    .from("seasons")
    .select("id, name, starts_on, ends_on, winner_name")
    .eq("show_id", showId)
    .not("winner_name", "is", null)
    .order("ends_on", { ascending: false, nullsFirst: false })
    .limit(1)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  const { data, error } = await query.maybeSingle()
  report("getLatestWinner", error)
  return (data as Season | null) ?? null
}

export async function getHousemates(seasonId: string): Promise<Housemate[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("housemates")
    .select("id, name, color, status, exit_week")
    .eq("season_id", seasonId)
    .order("sort_order")
  report("getHousemates", error)
  return (data ?? []) as Housemate[]
}

export async function getRankings(seasonId: string, top = 5): Promise<RankingCategory[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("ranking_categories")
    .select(
      "id, name, description, higher_is_better, sort_order, housemate_stats(value, housemate:housemates(id, name, color, status, exit_week))",
    )
    .eq("season_id", seasonId)
    .order("sort_order")
  report("getRankings", error)
  type Row = Omit<RankingCategory, "entries"> & { housemate_stats: RankingEntry[] }
  return ((data ?? []) as unknown as Row[]).map(({ housemate_stats, ...category }) => ({
    ...category,
    entries: [...housemate_stats]
      .sort((a, b) => (category.higher_is_better ? b.value - a.value : a.value - b.value))
      .slice(0, top),
  }))
}
