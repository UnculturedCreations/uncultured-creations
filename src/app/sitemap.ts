import type { MetadataRoute } from "next"
import { SITE_URL } from "@/app/data/site"
import { pillars } from "@/app/data/navigation"
import { getRecentFanStorySlugs, getRecentPostSlugs, getShows } from "@/lib/realityReloaded"

// Refresh the sitemap hourly so new shows appear without a redeploy.
export const revalidate = 3600

// Public pages only. Sections come from the navigation; show pages from the database.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [shows, stories, fanStories] = await Promise.all([getShows(), getRecentPostSlugs(), getRecentFanStorySlugs()])
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/fanzone/the-yard`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/fanzone/fiction`, changeFrequency: "daily", priority: 0.7 },
    ...pillars.map((item) => ({
      url: `${SITE_URL}${item.href}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(shows ?? [])
      .filter((show) => show.status !== "coming_soon")
      .map((show) => ({
        url: `${SITE_URL}/fanzone/${show.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    ...stories.map((story) => ({
      url: `${SITE_URL}/fanzone/stories/${story.slug}`,
      lastModified: story.published_at,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...fanStories.map((story) => ({
      url: `${SITE_URL}/fanzone/fiction/${story.slug}`,
      lastModified: story.published_at,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
  ]
}
