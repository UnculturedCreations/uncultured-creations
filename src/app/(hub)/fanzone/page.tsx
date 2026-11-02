import type { Metadata } from "next"
import ComingSoon from "@/app/components/common/ComingSoon"
import { pageMetadata } from "@/app/data/site"

const intro =
  "A home for reality TV fans. The housemates, the alliances, the nominations, the evictions, and every moment the group chats can’t stop talking about."

export const metadata: Metadata = pageMetadata("Reality Reloaded", intro, "/fanzone")

export default function Fanzone() {
  return (
    <ComingSoon
      title="Reality Reloaded"
      status="Off air for now"
      intro={intro}
      upcoming={[
        "Episode recaps and reactions",
        "Housemate profiles",
        "Fan polls and predictions",
        "Vote tracking and leaderboards for fanbases",
      ]}
      image="/images/landing/fanzone.png"
    />
  )
}
