import type { Metadata } from "next"
import ComingSoon from "@/app/components/common/ComingSoon"

const intro =
  "Songwriting, poetry and spoken word. Some pieces polished, some left raw, all of them honest about where they came from."

export const metadata: Metadata = {
  title: "Lyrics & Spoken Word | Uncultured Creations",
  description: intro,
}

export default function Music() {
  return (
    <ComingSoon
      title="Lyrics & Spoken Word"
      status="Still in the notebook"
      intro={intro}
      upcoming={["Original lyrics", "Poetry and spoken word pieces", "The stories behind the words"]}
      image="/images/landing/lyrics.png"
    />
  )
}
