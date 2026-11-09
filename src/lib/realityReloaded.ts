import { supabase } from "@/lib/supabase"

// Reality Reloaded data access. Every function returns safe empty values when
// the database is unreachable, so pages degrade gracefully instead of crashing.

// Sample rows (is_sample = true) are fictional placeholders. They show in
// previews and local development only when NEXT_PUBLIC_SHOW_SAMPLE_DATA=true;
// production leaves the variable unset, so visitors never see them.
const SHOW_SAMPLES = process.env.NEXT_PUBLIC_SHOW_SAMPLE_DATA === "true"

export type ShowStatus = "live" | "upcoming" | "off_season" | "coming_soon"
export type PostKind = "news" | "gossip" | "trending" | "recap" | "scenario" | "feature" | "announcement"
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
  cast_singular: string
  cast_plural: string
  venue: "house" | "villa"
  image_url: string | null
}

export interface ShowRef {
  slug: string
  name: string
  short_name: string | null
  accent_color: string | null
}

export interface Post {
  id: string
  slug: string
  image_url: string | null
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
  image_url: string | null
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

const SHOW_FIELDS = "id, slug, name, short_name, country, status, tagline, accent_color, cast_singular, cast_plural, venue, image_url"
const SHOW_REF = "show:shows(slug, name, short_name, accent_color)"
const POST_FIELDS = `id, slug, image_url, kind, title, summary, source_name, source_url, published_at, ${SHOW_REF}`

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

// Kinds shown in Top stories on the Reality Reloaded home (recaps and scenarios stay on show pages).
export const TOP_STORY_KINDS: PostKind[] = ["news", "gossip", "trending", "feature", "announcement"]

// Latest top-story posts across every show (and general posts).
export async function getTopStories(limit = 6): Promise<Post[]> {
  if (!supabase) return []
  let query = supabase
    .from("posts")
    .select(POST_FIELDS)
    .in("kind", TOP_STORY_KINDS)
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
    .select("id, name, color, image_url, status, exit_week")
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
      "id, name, description, higher_is_better, sort_order, housemate_stats(value, housemate:housemates(id, name, color, image_url, status, exit_week))",
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

// ---------------------------------------------------------------------
// Polls and quizzes
// ---------------------------------------------------------------------

export interface PollOption {
  id: string
  label: string
  housemate: { name: string; color: string | null; image_url: string | null } | null
}

export interface Poll {
  id: string
  question: string
  status: "open" | "closed"
  show_results: "after_vote" | "always" | "after_close"
  closes_at: string | null
  options: PollOption[]
  // Vote totals by option id, included when visitors may already see them.
  results: Record<string, number> | null
}

export interface QuizOption {
  id: string
  label: string
  is_correct: boolean
}

export interface QuizQuestion {
  id: string
  prompt: string
  explanation: string | null
  options: QuizOption[]
}

export interface Quiz {
  id: string
  title: string
  description: string | null
  questions: QuizQuestion[]
}

const bySortOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order

export async function getPollResults(pollId: string): Promise<Record<string, number> | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc("poll_results", { p_poll_id: pollId })
  report("getPollResults", error)
  if (error || !data) return null
  return Object.fromEntries((data as { option_id: string; votes: number }[]).map((r) => [r.option_id, Number(r.votes)]))
}

// Open polls first, then the most recent closed ones.
export async function getPolls(showId: string, limit = 6): Promise<Poll[]> {
  if (!supabase) return []
  let query = supabase
    .from("polls")
    .select("id, question, status, show_results, closes_at, created_at, poll_options(id, label, sort_order, housemate:housemates(name, color, image_url))")
    .eq("show_id", showId)
    .in("status", ["open", "closed"])
    .order("status", { ascending: false }) // "open" sorts after "closed" alphabetically; descending puts open first
    .order("created_at", { ascending: false })
    .limit(limit)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  const { data, error } = await query
  report("getPolls", error)
  type Row = Omit<Poll, "options" | "results"> & { poll_options: (PollOption & { sort_order: number })[] }
  const rows = (data ?? []) as unknown as Row[]
  return Promise.all(
    rows.map(async ({ poll_options, ...poll }) => {
      // A poll whose closing time has passed counts as closed, even if nobody closed it by hand.
      const closedByTime = poll.closes_at !== null && new Date(poll.closes_at).getTime() <= Date.now()
      const status = closedByTime ? "closed" : poll.status
      const visible = status === "closed" || poll.show_results === "always"
      return {
        id: poll.id,
        question: poll.question,
        status,
        show_results: poll.show_results,
        closes_at: poll.closes_at,
        options: [...poll_options].sort(bySortOrder).map(({ id, label, housemate }) => ({ id, label, housemate })),
        results: visible ? await getPollResults(poll.id) : null,
      }
    }),
  )
}

export async function getQuizzes(showId: string, limit = 3): Promise<Quiz[]> {
  if (!supabase) return []
  let query = supabase
    .from("quizzes")
    .select("id, title, description, published_at, quiz_questions(id, prompt, explanation, sort_order, quiz_options(id, label, is_correct, sort_order))")
    .eq("show_id", showId)
    .order("published_at", { ascending: false })
    .limit(limit)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  const { data, error } = await query
  report("getQuizzes", error)
  type QRow = Omit<QuizQuestion, "options"> & { sort_order: number; quiz_options: (QuizOption & { sort_order: number })[] }
  type Row = Omit<Quiz, "questions"> & { quiz_questions: QRow[] }
  return ((data ?? []) as unknown as Row[])
    .map(({ quiz_questions, ...quiz }) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questions: [...quiz_questions].sort(bySortOrder).map(({ quiz_options, ...q }) => ({
        id: q.id,
        prompt: q.prompt,
        explanation: q.explanation,
        options: [...quiz_options].sort(bySortOrder).map(({ id, label, is_correct }) => ({ id, label, is_correct })),
      })),
    }))
    .filter((quiz) => quiz.questions.length > 0)
}

// ---------------------------------------------------------------------
// Story pages
// ---------------------------------------------------------------------

export interface FullPost extends Post {
  body: string | null
  image_alt: string | null
}

// available = false means the database could not be reached (not "no such story").
export async function getPostBySlug(slug: string): Promise<{ post: FullPost | null; available: boolean }> {
  if (!supabase) return { post: null, available: false }
  let query = supabase.from("posts").select(`${POST_FIELDS}, body, image_alt`).eq("slug", slug)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  const { data, error } = await query.maybeSingle()
  report("getPostBySlug", error)
  if (error) return { post: null, available: false }
  return { post: (data as unknown as FullPost | null) ?? null, available: true }
}

// Recent published stories for the sitemap.
export async function getRecentPostSlugs(limit = 200): Promise<{ slug: string; published_at: string }[]> {
  if (!supabase) return []
  let query = supabase.from("posts").select("slug, published_at").order("published_at", { ascending: false }).limit(limit)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  const { data, error } = await query
  report("getRecentPostSlugs", error)
  return (data ?? []) as { slug: string; published_at: string }[]
}

// ---------------------------------------------------------------------
// Eviction-night bingo
// ---------------------------------------------------------------------

export interface BingoCard {
  id: string
  title: string
  description: string | null
  size: 4 | 5
  items: string[]
}

export async function getBingoCards(showId: string, limit = 2): Promise<BingoCard[]> {
  if (!supabase) return []
  let query = supabase
    .from("bingo_cards")
    .select("id, title, description, size, items")
    .eq("show_id", showId)
    .order("published_at", { ascending: false })
    .limit(limit)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  const { data, error } = await query
  report("getBingoCards", error)
  return (data ?? []) as BingoCard[]
}

// ---------------------------------------------------------------------
// Fan fiction (only editor-approved stories are readable by visitors)
// ---------------------------------------------------------------------

export interface FanStory {
  id: string
  slug: string
  title: string
  pen_name: string
  blurb: string | null
  published_at: string
  genres: string[]
  content_notes: string[]
  cover_url: string | null
  featured: boolean
  reaction_total: number
  word_count: number
  prompt: { id: string; title: string } | null
  show: ShowRef | null
}

export interface WritingPrompt {
  id: string
  title: string
  prompt: string
  show: ShowRef | null
}

export interface FullFanStory extends FanStory {
  body: string
}

const FAN_STORY_FIELDS = `id, slug, title, pen_name, blurb, published_at, genres, content_notes, cover_url, featured, reaction_total, word_count, prompt:writing_prompts(id, title), ${SHOW_REF}`

export async function getFanStories(showId: string, limit = 6): Promise<FanStory[]> {
  if (!supabase) return []
  let query = supabase.from("fan_stories").select(FAN_STORY_FIELDS).eq("show_id", showId).order("published_at", { ascending: false }).limit(limit)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  const { data, error } = await query
  report("getFanStories", error)
  return (data ?? []) as unknown as FanStory[]
}

// available = false means the database could not be reached (not "no such story").
export async function getFanStoryBySlug(slug: string): Promise<{ story: FullFanStory | null; available: boolean }> {
  if (!supabase) return { story: null, available: false }
  let query = supabase.from("fan_stories").select(`${FAN_STORY_FIELDS}, body`).eq("slug", slug)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  const { data, error } = await query.maybeSingle()
  report("getFanStoryBySlug", error)
  if (error) return { story: null, available: false }
  return { story: (data as unknown as FullFanStory | null) ?? null, available: true }
}

export async function getRecentFanStorySlugs(limit = 200): Promise<{ slug: string; published_at: string }[]> {
  if (!supabase) return []
  let query = supabase.from("fan_stories").select("slug, published_at").order("published_at", { ascending: false }).limit(limit)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  const { data, error } = await query
  report("getRecentFanStorySlugs", error)
  return (data ?? []) as { slug: string; published_at: string }[]
}

// Filtered list for the fan fiction home page.
export async function listFanStories(opts: { showId?: string; genre?: string; sort?: "new" | "loved"; featuredOnly?: boolean; limit?: number }): Promise<FanStory[]> {
  if (!supabase) return []
  let query = supabase.from("fan_stories").select(FAN_STORY_FIELDS)
  if (opts.showId) query = query.eq("show_id", opts.showId)
  if (opts.genre) query = query.contains("genres", [opts.genre])
  if (opts.featuredOnly) query = query.eq("featured", true)
  if (!SHOW_SAMPLES) query = query.eq("is_sample", false)
  query = opts.sort === "loved" ? query.order("reaction_total", { ascending: false }).order("published_at", { ascending: false }) : query.order("published_at", { ascending: false })
  const { data, error } = await query.limit(opts.limit ?? 48)
  report("listFanStories", error)
  return (data ?? []) as unknown as FanStory[]
}

// Active writing prompts, for one show (plus prompts not tied to a show) or for all.
export async function getActivePrompts(showId?: string): Promise<WritingPrompt[]> {
  if (!supabase) return []
  let query = supabase.from("writing_prompts").select(`id, title, prompt, ${SHOW_REF}`).eq("status", "active").order("created_at", { ascending: false })
  if (showId) query = query.or(`show_id.eq.${showId},show_id.is.null`)
  const { data, error } = await query.limit(5)
  report("getActivePrompts", error)
  return (data ?? []) as unknown as WritingPrompt[]
}

export async function getStoryReactions(storyId: string): Promise<Record<string, number>> {
  if (!supabase) return {}
  const { data, error } = await supabase.rpc("story_reactions", { p_story_id: storyId })
  report("getStoryReactions", error)
  return Object.fromEntries(((data ?? []) as { reaction: string; total: number }[]).map((r) => [r.reaction, Number(r.total)]))
}

// ---------------------------------------------------------------------
// Predictions and leaderboards
// ---------------------------------------------------------------------

export interface PredictionOption {
  id: string
  label: string
  is_correct: boolean
  housemate: { name: string; color: string | null; image_url: string | null } | null
}

export interface PredictionRound {
  id: string
  question: string
  points: number
  locks_at: string
  status: "open" | "resolved"
  options: PredictionOption[]
  // Pick totals per option, available once picks have locked.
  counts: Record<string, number> | null
}

export interface LeaderboardRow {
  rank: number
  fan_name: string
  points: number
  correct: number
  played: number
  is_me: boolean
}

export async function getRoundPickCounts(roundId: string): Promise<Record<string, number> | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc("round_pick_counts", { p_round_id: roundId })
  report("getRoundPickCounts", error)
  if (error || !data || (data as unknown[]).length === 0) return null
  return Object.fromEntries((data as { option_id: string; picks: number }[]).map((r) => [r.option_id, Number(r.picks)]))
}

// Open rounds first, then the most recently resolved ones.
export async function getPredictionRounds(showId: string, limit = 4): Promise<PredictionRound[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("prediction_rounds")
    .select("id, question, points, locks_at, status, prediction_options(id, label, sort_order, is_correct, housemate:housemates(name, color, image_url))")
    .eq("show_id", showId)
    .in("status", ["open", "resolved"])
    .order("status")
    .order("locks_at", { ascending: false })
    .limit(limit)
  report("getPredictionRounds", error)
  type Row = Omit<PredictionRound, "options" | "counts"> & { prediction_options: (PredictionOption & { sort_order: number })[] }
  const rows = (data ?? []) as unknown as Row[]
  return Promise.all(
    rows.map(async ({ prediction_options, ...round }) => {
      const locked = round.status === "resolved" || new Date(round.locks_at).getTime() <= Date.now()
      return {
        ...round,
        options: [...prediction_options].sort((a, b) => a.sort_order - b.sort_order).map(({ id, label, is_correct, housemate }) => ({ id, label, is_correct, housemate })),
        counts: locked ? await getRoundPickCounts(round.id) : null,
      }
    }),
  )
}

export async function getLeaderboard(showId: string, seasonId: string | null, limit = 10): Promise<LeaderboardRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc("season_leaderboard", { p_show_id: showId, p_season_id: seasonId, p_limit: limit })
  report("getLeaderboard", error)
  return ((data ?? []) as LeaderboardRow[]).map((r) => ({ ...r, rank: Number(r.rank), points: Number(r.points), correct: Number(r.correct), played: Number(r.played) }))
}
