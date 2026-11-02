import type { MetadataRoute } from "next"
import { SITE_URL } from "@/app/data/site"
import { pillars } from "@/app/data/navigation"

// Public pages only. Add new pages here as sections go live.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    ...pillars.map((item) => ({
      url: `${SITE_URL}${item.href}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]
}
