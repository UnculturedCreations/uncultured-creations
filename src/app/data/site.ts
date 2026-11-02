import type { Metadata } from "next"

// Public address of the site, used for absolute links in sitemaps and social previews.
// Set NEXT_PUBLIC_SITE_URL in Vercel when a custom domain is connected.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://uncultured-creations.vercel.app").replace(/\/$/, "")

export const SITE_NAME = "Uncultured Creations"

export const SITE_DESCRIPTION =
  "A creative hub of bold storytelling, unapologetic fandom and raw creativity: reality TV fandom, original fiction, lyrics, spoken word and experiments."

// Site-wide link-preview image (src/app/opengraph-image.jpg). Pages that set their own
// openGraph/twitter fields must list it explicitly, or Next.js drops the inherited image.
const PREVIEW_IMAGE = {
  url: "/opengraph-image.jpg",
  width: 1200,
  height: 630,
  alt: "Uncultured Creations: a hub of bold storytelling, unapologetic fandom, and raw creativity.",
}

// Page title, search description and social-preview text for a section page.
export function pageMetadata(title: string, description: string, path: string): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`
  return {
    title: fullTitle,
    description,
    alternates: { canonical: path },
    openGraph: { title: fullTitle, description, url: path, siteName: SITE_NAME, type: "website", images: [PREVIEW_IMAGE] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [PREVIEW_IMAGE] },
  }
}
