import type { Metadata } from "next"
import ComingSoon from "@/app/components/common/ComingSoon"
import { pageMetadata } from "@/app/data/site"

const intro =
  "Experiments, prototypes and half-formed ideas. Work that doesn’t fit anywhere else yet, shared before it turns into something else."

export const metadata: Metadata = pageMetadata("The Lab", intro, "/the-lab")

export default function TheLab() {
  return (
    <ComingSoon
      title="The Lab"
      status="Unfinished on purpose"
      intro={intro}
      upcoming={["Works in progress", "Creative and technical experiments", "Ideas that might become something bigger"]}
      image="/images/landing/lab.png"
    />
  )
}
