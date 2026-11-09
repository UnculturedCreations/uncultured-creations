import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { pageMetadata } from "@/app/data/site"
import { getCurrentSeason, getLeaderboard, getShowBySlug } from "@/lib/realityReloaded"
import LeaderboardTable from "@/app/components/fanzone/LeaderboardTable"
import MyStanding from "@/app/components/fanzone/MyStanding"
import { FanSiteNote, focusRing } from "@/app/components/fanzone/ui"

export const revalidate = 60
type Params = { params: Promise<{ show: string }> }

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { show: slug } = await params
  const { show } = await getShowBySlug(slug)
  if (!show) return { title: "Page not found | Uncultured Creations" }
  return pageMetadata(`${show.name} predictions leaderboard`, `The top ${show.short_name ?? show.name} predictors this season on Reality Reloaded.`, `/fanzone/${show.slug}/leaderboard`)
}

export default async function LeaderboardPage({ params }: Params) {
  const { show: slug } = await params
  const { show, available } = await getShowBySlug(slug)
  if (!available) return <main className="mx-auto max-w-3xl px-4 py-20 text-contrast/80 sm:px-6">This page is unavailable right now. Please check back in a few minutes.</main>
  if (!show || show.status === "coming_soon") notFound()
  const season = await getCurrentSeason(show.id)
  const rows = await getLeaderboard(show.id, season?.id ?? null, 100)

  return (
    <main>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <Link href={`/fanzone/${show.slug}`} className={`inline-flex items-center gap-1.5 rounded-sm text-sm text-contrast/70 hover:text-contrast ${focusRing}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {show.name}
        </Link>
        <h1 className="mt-6 font-heading text-3xl font-bold text-contrast sm:text-5xl">Predictions leaderboard</h1>
        <p className="mt-3 text-contrast/80">
          {season ? `${show.name}, ${season.name}.` : `${show.name}.`} Points come from correct predictions; ties share a place.
        </p>
        <div className="mt-8">
          <MyStanding showId={show.id} seasonId={season?.id ?? null} />
          {rows.length > 0 ? (
            <LeaderboardTable rows={rows} caption={`Top predictors for ${show.name}`} />
          ) : (
            <p className="text-contrast/75">No results yet. The leaderboard fills up after the first prediction round is decided.</p>
          )}
        </div>
      </div>
      <FanSiteNote />
    </main>
  )
}
