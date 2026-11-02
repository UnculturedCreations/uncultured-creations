import type { Metadata } from "next"
import ComingSoon from "@/app/components/common/ComingSoon"

const intro =
  "A home for Big Brother Naija and Big Brother Mzansi fans. The housemates, the alliances, the nominations, the evictions, and every moment the group chats can’t stop talking about."

export const metadata: Metadata = {
  title: "Reality Reloaded | Uncultured Creations",
  description: intro,
}

export default function Fanzone() {
  return (
    <ComingSoon
      title="Reality Reloaded"
      status="Off air for now"
      intro={intro}
      upcoming={["Episode recaps and reactions", "Housemate profiles", "Fan polls and predictions"]}
      image="/images/landing/fanzone.png"
    />
  )
}
