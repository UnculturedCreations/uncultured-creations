import type { Housemate } from "@/lib/realityReloaded"
import { HousemateAvatar, housemateStatusLabel } from "./ui"

export default function HousemateGrid({ housemates, venue = "house" }: { housemates: Housemate[]; venue?: "house" | "villa" }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {housemates.map((h) => {
        const out = h.status !== "in_house" && h.status !== "winner"
        return (
          <li key={h.id} className="flex items-center gap-3 rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-4">
            <HousemateAvatar name={h.name} color={h.color} imageUrl={h.image_url} dimmed={out} />
            <div className="min-w-0">
              <p className="truncate font-medium text-contrast">{h.name}</p>
              <p className={`text-xs ${out ? "text-contrast/55" : "text-contrast/75"}`}>{housemateStatusLabel(h.status, h.exit_week, venue)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
