// A story's cover: the writer's own (approved) image, or an automatic designed cover
// with the title and pen name on the show's colour. Decorative: the title is always shown nearby.

export default function FanStoryCover({
  title,
  penName,
  accent,
  coverUrl,
  size = "card",
}: {
  title: string
  penName: string
  accent: string | null
  coverUrl: string | null
  size?: "thumb" | "card" | "large"
}) {
  const dims = size === "thumb" ? "w-20" : size === "card" ? "w-24 sm:w-28" : "w-full max-w-xs"
  if (coverUrl) {
    return (
      // Covers are resized to 600 x 900 when submitted.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverUrl} alt="" width={600} height={900} loading="lazy" decoding="async" className={`${dims} aspect-[2/3] shrink-0 rounded-lg object-cover shadow-lg`} />
    )
  }
  const color = accent ?? "#0066FF"
  const titleSize = size === "large" ? "text-2xl" : size === "card" ? "text-[0.8rem] sm:text-sm" : "text-[0.7rem]"
  return (
    <div
      aria-hidden="true"
      className={`${dims} relative flex aspect-[2/3] shrink-0 flex-col justify-between overflow-hidden rounded-lg p-2.5 shadow-lg sm:p-3`}
      style={{ background: `linear-gradient(160deg, ${color} 0%, #A855F7 55%, #121212 100%)` }}
    >
      <span className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/15" />
      <span className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-black/20" />
      <span className={`relative line-clamp-5 font-heading font-bold leading-tight text-white ${titleSize}`}>{title}</span>
      <span className={`relative truncate text-white/85 ${size === "large" ? "text-sm" : "text-[0.6rem] sm:text-xs"}`}>{penName}</span>
    </div>
  )
}
