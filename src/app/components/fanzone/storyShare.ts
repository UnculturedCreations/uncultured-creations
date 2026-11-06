// Draws a 1080 x 1350 share card for a fan fiction story: cover, title, pen name, show.
const W = 1080
const H = 1350

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = []
  let line = ""
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      out.push(line)
      line = word
    } else line = test
  }
  if (line) out.push(line)
  return out
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function drawStoryShare(opts: { title: string; penName: string; showName: string | null; accent: string | null; coverUrl: string | null; url: string }): Promise<Blob> {
  const body = getComputedStyle(document.body).fontFamily
  const heading = getComputedStyle(document.querySelector("h1") ?? document.body).fontFamily
  await document.fonts?.ready
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas unavailable")

  ctx.fillStyle = "#121212"
  ctx.fillRect(0, 0, W, H)
  for (const [x, y, r, color] of [
    [140, 160, 460, "rgba(0,102,255,0.32)"],
    [W - 100, H - 160, 480, "rgba(168,85,247,0.30)"],
  ] as const) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, color)
    g.addColorStop(1, "rgba(18,18,18,0)")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }

  ctx.textAlign = "center"
  ctx.fillStyle = "rgba(240,235,225,0.75)"
  ctx.font = `600 32px ${body}`
  ctx.fillText(opts.showName ? `Fan fiction · ${opts.showName}` : "Fan fiction", W / 2, 110)

  // Cover: the writer's image, or the automatic design.
  const cw = 440
  const ch = 660
  const cx = (W - cw) / 2
  const cy = 160
  let drewImage = false
  if (opts.coverUrl) {
    try {
      ctx.drawImage(await loadImage(opts.coverUrl), cx, cy, cw, ch)
      drewImage = true
    } catch {
      // fall back to the designed cover
    }
  }
  if (!drewImage) {
    const g = ctx.createLinearGradient(cx, cy, cx + cw * 0.6, cy + ch)
    g.addColorStop(0, opts.accent ?? "#0066FF")
    g.addColorStop(0.55, "#A855F7")
    g.addColorStop(1, "#121212")
    ctx.fillStyle = g
    ctx.fillRect(cx, cy, cw, ch)
    ctx.fillStyle = "rgba(255,255,255,0.15)"
    ctx.beginPath()
    ctx.arc(cx + cw - 20, cy + 30, 110, 0, Math.PI * 2)
    ctx.fill()
    ctx.textAlign = "left"
    ctx.fillStyle = "#FFFFFF"
    ctx.font = `700 46px ${heading}`
    wrap(ctx, opts.title, cw - 70)
      .slice(0, 6)
      .forEach((line, i) => ctx.fillText(line, cx + 35, cy + 90 + i * 56))
    ctx.font = `500 28px ${body}`
    ctx.fillStyle = "rgba(255,255,255,0.85)"
    ctx.fillText(opts.penName, cx + 35, cy + ch - 40)
    ctx.textAlign = "center"
  }

  ctx.fillStyle = "#F0EBE1"
  ctx.font = `700 54px ${heading}`
  const titleLines = wrap(ctx, opts.title, W - 160).slice(0, 2)
  titleLines.forEach((line, i) => ctx.fillText(line, W / 2, 900 + i * 64))
  ctx.fillStyle = "rgba(240,235,225,0.8)"
  ctx.font = `500 34px ${body}`
  ctx.fillText(`by ${opts.penName}`, W / 2, 900 + titleLines.length * 64 + 20)

  ctx.fillStyle = "rgba(240,235,225,0.85)"
  ctx.font = `600 30px ${body}`
  ctx.fillText("Read it on Reality Reloaded", W / 2, H - 100)
  ctx.fillStyle = "rgba(240,235,225,0.6)"
  ctx.font = `400 24px ${body}`
  const shortUrl = opts.url.replace(/^https?:\/\//, "")
  ctx.fillText(shortUrl.length > 70 ? shortUrl.slice(0, 67) + "..." : shortUrl, W / 2, H - 56)

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't create image"))), "image/png"))
}
