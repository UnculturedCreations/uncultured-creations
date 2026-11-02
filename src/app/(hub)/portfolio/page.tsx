import type { Metadata } from "next"
import ComingSoon from "@/app/components/common/ComingSoon"
import { pageMetadata } from "@/app/data/site"

const intro =
  "Selected creative and client work: branding, graphic design, web design and development, with the thinking behind each project."

export const metadata: Metadata = pageMetadata("Portfolio", intro, "/portfolio")

export default function Portfolio() {
  return (
    <ComingSoon
      title="Portfolio"
      status="Being curated"
      intro={intro}
      upcoming={["Selected client projects", "Branding and graphic design work", "Web design and development case studies"]}
      image="/images/landing/portfolio.png"
    />
  )
}
