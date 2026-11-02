import type { Metadata } from "next"
import ComingSoon from "@/app/components/common/ComingSoon"

const intro =
  "Selected creative and client work: branding, graphic design, web design and development, with the thinking behind each project."

export const metadata: Metadata = {
  title: "Portfolio | Uncultured Creations",
  description: intro,
}

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
