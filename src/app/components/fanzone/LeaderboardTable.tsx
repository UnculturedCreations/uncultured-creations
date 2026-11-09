import type { LeaderboardRow } from "@/lib/realityReloaded"

export default function LeaderboardTable({ rows, caption }: { rows: LeaderboardRow[]; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-contrast/10 bg-contrast/[0.03]">
      <table className="min-w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-left text-xs text-contrast/65">
            <th scope="col" className="px-4 py-3 font-medium">Rank</th>
            <th scope="col" className="px-4 py-3 font-medium">Fan</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Points</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Correct</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.rank}-${r.fan_name}`} className="border-t border-contrast/10">
              <td className="px-4 py-2.5 tabular-nums text-contrast/80">
                {r.rank <= 3 ? <span aria-label={`Rank ${r.rank}`}>{["🥇", "🥈", "🥉"][r.rank - 1]}</span> : r.rank}
              </td>
              <th scope="row" className="px-4 py-2.5 text-left font-medium text-contrast">
                {r.fan_name}
              </th>
              <td className="px-4 py-2.5 text-right font-bold tabular-nums text-contrast">{r.points}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-contrast/75">
                {r.correct}/{r.played}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
