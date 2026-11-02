import type { Metadata } from "next"
import ComingSoon from "@/app/components/common/ComingSoon"
import { pageMetadata } from "@/app/data/site"

const intro =
  "Original fiction, characters and visual novels. Worlds with their own atmosphere, stakes and mysteries, made to be explored one chapter at a time."

export const metadata: Metadata = pageMetadata("Stories", intro, "/stories")

export default function Stories() {
  return (
    <ComingSoon
      title="Stories"
      status="In the writing room"
      intro={intro}
      upcoming={["Original short fiction", "Visual novels", "Characters and the worlds they live in"]}
      image="/images/landing/stories.png"
    />
  )
}
