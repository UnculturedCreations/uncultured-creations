import type { RankingCategory } from "@/lib/realityReloaded"
import { HousemateAvatar } from "./ui"

// One card per ranking category, top housemates with a bar relative to the leader.
export default function RankingsBoard({ categories }: { categories: RankingCategory[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => {
        const max = Math.max(1, ...category.entries.map((e) => e.value))
        // Bars show how well each housemate is doing: for "fewest" rankings, lower values get longer bars.
        const barWidth = (value: number) =>
          category.higher_is_better ? (value / max) * 100 : Math.max(4, ((max - value) / max) * 100)
        return (
          <section key={category.id} aria-labelledby={`rank-${category.id}`} className="rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-5">
            <h3 id={`rank-${category.id}`} className="font-heading text-lg font-bold text-contrast">
              {category.name}
            </h3>
            {category.description && <p className="mt-1 text-sm text-contrast/65">{category.description}</p>}
            {category.entries.length === 0 ? (
              <p className="mt-4 text-sm text-contrast/65">No results yet.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {category.entries.map((entry, i) => (
                  <li key={entry.housemate.id} className="flex items-center gap-3">
                    <span className="w-4 text-right text-sm tabular-nums text-contrast/60">{i + 1}</span>
                    <HousemateAvatar name={entry.housemate.name} color={entry.housemate.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm text-contrast">{entry.housemate.name}</span>
                        <span className="text-sm font-bold tabular-nums text-contrast">{entry.value}</span>
                      </div>
                      <div aria-hidden="true" className="mt-1 h-1.5 rounded-full bg-contrast/10">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-accent to-secondary" style={{ width: `${barWidth(entry.value)}%` }} />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )
      })}
    </div>
  )
}
