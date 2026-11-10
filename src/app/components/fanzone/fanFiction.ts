// Shared fan fiction definitions: rules, genres, content notes and reactions.
// The allowed values must match the database checks in migration 0010.

export const FAN_FICTION_RULES = [
  "It's your own original writing, not copied from anyone else.",
  "It's clearly fiction: don't present made-up events as things that really happened.",
  "No sexual content.",
  "No hate, harassment or bullying of anyone, including housemates, islanders and their families.",
  "No stories involving children.",
  "Between 300 and 20,000 characters.",
  "If you add your own cover, use an image you made or have the right to use, not a photo of a real person.",
]

export const FICTION_DISCLAIMER = "Fan fiction: a work of imagination, not real events. Real people appear only as characters in a story."

export const GENRES = [
  { value: "romance", label: "Romance" },
  { value: "drama", label: "Drama" },
  { value: "comedy", label: "Comedy" },
  { value: "thriller", label: "Thriller" },
  { value: "what_if", label: "What if" },
  { value: "friendship", label: "Friendship" },
  { value: "other", label: "Other" },
] as const

export const CONTENT_NOTES = [
  { value: "strong_language", label: "Strong language" },
  { value: "violence", label: "Violence" },
  { value: "heartbreak", label: "Heartbreak" },
  { value: "mature_themes", label: "Mature themes" },
] as const

export const REACTIONS = [
  { value: "love", emoji: "❤️", label: "Love it" },
  { value: "laugh", emoji: "😂", label: "Funny" },
  { value: "wow", emoji: "😮", label: "Wow" },
  { value: "sad", emoji: "😢", label: "Sad" },
  { value: "fire", emoji: "🔥", label: "Fire" },
] as const

export const genreLabel = (v: string) => GENRES.find((g) => g.value === v)?.label ?? v
export const noteLabel = (v: string) => CONTENT_NOTES.find((n) => n.value === v)?.label ?? v

// About 200 words a minute; never less than one minute.
export const readingMinutes = (words: number) => Math.max(1, Math.round(words / 200))

// Reasons an editor can give when declining a story or chapter (must match migration 0015).
export const DECLINE_REASONS = [
  { value: "sexual_content", label: "Sexual content" },
  { value: "harassment", label: "Hate, harassment or bullying" },
  { value: "presented_as_fact", label: "Reads as real events, not clearly fiction" },
  { value: "not_original", label: "Not original writing" },
  { value: "children", label: "Involves children" },
  { value: "too_short", label: "Too short or unfinished" },
  { value: "cover_image", label: "Cover image isn't allowed" },
  { value: "other", label: "Something else (see note)" },
] as const

export const declineReasonLabel = (v: string) => DECLINE_REASONS.find((r) => r.value === v)?.label ?? v
