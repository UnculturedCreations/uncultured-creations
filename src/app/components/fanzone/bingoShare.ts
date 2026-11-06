// Draws a fan's marked bingo card as a 1080 x 1350 image for sharing.
import { FREE } from "./bingo"

const W = 1080
const H = 1350

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const out: string[] = []
  let line = ""
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      out.push(line)
      line = word
    } else line = test
  }
  if (line) out.push(line)
  return out
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function drawBingoImage(opts: {
  title: string
  showName: string
  size: 4 | 5
  squares: string[]
  ticked: boolean[]
  winning: Set<number>
  bingo: boolean
  url: string
}): Promise<Blob> {
  // Use the fonts the page already loaded (next/font gives them generated names).
  const body = getComputedStyle(document.body).fontFamily
  const heading = getComputedStyle(document.querySelector("h1") ?? document.body).fontFamily
  await document.fonts?.ready

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas unavailable")

  // Background with the brand's soft glows.
  ctx.fillStyle = "#121212"
  ctx.fillRect(0, 0, W, H)
  for (const [x, y, r, color] of [
    [140, 120, 420, "rgba(0,102,255,0.35)"],
    [W - 120, H - 140, 460, "rgba(168,85,247,0.32)"],
  ] as const) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, color)
    g.addColorStop(1, "rgba(18,18,18,0)")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }

  // Heading.
  ctx.textAlign = "center"
  ctx.fillStyle = "rgba(240,235,225,0.75)"
  ctx.font = `600 34px ${body}`
  ctx.fillText(opts.showName, W / 2, 110)
  const grad = ctx.createLinearGradient(200, 0, W - 200, 0)
  grad.addColorStop(0, "#0066FF")
  grad.addColorStop(1, "#A855F7")
  ctx.fillStyle = grad
  ctx.font = `700 64px ${heading}`
  wrap(ctx, opts.title, W - 160)
    .slice(0, 2)
    .forEach((line, i) => ctx.fillText(line, W / 2, 190 + i * 72))

  // Grid: sized to sit between the heading and the footer.
  const gridTop = 300
  const gridSize = 860
  const gap = 12
  const cell = (gridSize - gap * (opts.size - 1)) / opts.size
  const left = (W - gridSize) / 2
  const startPx = opts.size === 5 ? 24 : 30
  opts.squares.forEach((text, i) => {
    const r = Math.floor(i / opts.size)
    const c = i % opts.size
    const x = left + c * (cell + gap)
    const y = gridTop + r * (cell + gap)
    roundRect(ctx, x, y, cell, cell, 22)
    if (opts.ticked[i]) {
      const g = ctx.createLinearGradient(x, y, x + cell, y + cell)
      g.addColorStop(0, "#0066FF")
      g.addColorStop(1, "#A855F7")
      ctx.fillStyle = g
    } else ctx.fillStyle = "rgba(240,235,225,0.06)"
    ctx.fill()
    ctx.lineWidth = opts.winning.has(i) ? 6 : 2
    ctx.strokeStyle = opts.winning.has(i) ? "#F0EBE1" : "rgba(240,235,225,0.15)"
    ctx.stroke()
    ctx.fillStyle = opts.ticked[i] ? "#FFFFFF" : "rgba(240,235,225,0.9)"
    // Shrink the text until the whole moment fits inside its square (never cut words off).
    let fontPx = text === FREE ? startPx + 6 : startPx
    let linesOfText: string[] = []
    for (; fontPx >= 14; fontPx -= 2) {
      ctx.font = text === FREE ? `700 ${fontPx}px ${heading}` : `500 ${fontPx}px ${body}`
      linesOfText = wrap(ctx, text === FREE ? "FREE" : text, cell - 20)
      const widest = Math.max(...linesOfText.map((l) => ctx.measureText(l).width))
      if (linesOfText.length * fontPx * 1.2 <= cell - 20 && widest <= cell - 20) break
    }
    const lh = fontPx * 1.2
    linesOfText.forEach((line, j) => ctx.fillText(line, x + cell / 2, y + cell / 2 - ((linesOfText.length - 1) * lh) / 2 + j * lh + fontPx / 3))
  })

  // BINGO banner.
  if (opts.bingo) {
    ctx.save()
    ctx.translate(W / 2, gridTop + gridSize / 2)
    ctx.rotate(-0.12)
    roundRect(ctx, -230, -62, 460, 124, 34)
    ctx.fillStyle = "#F0EBE1"
    ctx.fill()
    ctx.fillStyle = "#121212"
    ctx.font = `700 92px ${heading}`
    ctx.fillText("BINGO!", 0, 32)
    ctx.restore()
  }

  // Footer.
  ctx.fillStyle = "rgba(240,235,225,0.85)"
  ctx.font = `600 30px ${body}`
  ctx.fillText("Play along on Reality Reloaded", W / 2, H - 100)
  ctx.fillStyle = "rgba(240,235,225,0.6)"
  ctx.font = `400 26px ${body}`
  ctx.fillText(opts.url.replace(/^https?:\/\//, ""), W / 2, H - 56)

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't create image"))), "image/png"))
}
