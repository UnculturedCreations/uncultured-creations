// Pure helpers for bingo cards (no React), shared by the card and its share image.

export const FREE = "FREE"

// Small seeded random generator, so a fan's card stays the same across reloads.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Shuffle the moments with the fan's seed and lay them out; a 5 x 5 card gets a free centre.
export function buildCard(items: string[], size: 4 | 5, seed: number): string[] {
  const unique = [...new Set(items.map((i) => i.trim()).filter(Boolean))]
  const rand = mulberry32(seed)
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[unique[i], unique[j]] = [unique[j], unique[i]]
  }
  const needed = size * size - (size === 5 ? 1 : 0)
  const squares = unique.slice(0, needed)
  if (size === 5) squares.splice(12, 0, FREE)
  return squares
}

// Every row, column and diagonal, as lists of square positions.
export function lines(size: number): number[][] {
  const out: number[][] = []
  for (let r = 0; r < size; r++) out.push([...Array(size)].map((_, c) => r * size + c))
  for (let c = 0; c < size; c++) out.push([...Array(size)].map((_, r) => r * size + c))
  out.push([...Array(size)].map((_, i) => i * size + i))
  out.push([...Array(size)].map((_, i) => i * size + (size - 1 - i)))
  return out
}

// Completed lines, given which squares are ticked.
export function completedLines(size: number, ticked: boolean[]): number[][] {
  return lines(size).filter((line) => line.every((i) => ticked[i]))
}
