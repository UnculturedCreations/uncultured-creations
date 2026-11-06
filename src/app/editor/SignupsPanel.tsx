"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button, Card, formatDate, useNotice } from "./fields"

interface Signup {
  id: string
  email: string
  name: string | null
  role: "landlord" | "resident"
  fanbase_name: string | null
  fanbase_size: string | null
  current_tools: string | null
  created_at: string
  show: { name: string } | null
}

const SIZE_LABEL: Record<string, string> = {
  under_100: "Under 100",
  "100_1000": "100 to 1,000",
  "1000_10000": "1,000 to 10,000",
  over_10000: "Over 10,000",
}

// Spreadsheet-safe CSV: quote every cell, and neutralise values a spreadsheet would run as a formula.
function csvCell(value: string | null) {
  let v = value ?? ""
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`
  return `"${v.replace(/"/g, '""')}"`
}

// Admin only: early-access sign-ups for The Yard (personal data).
export default function SignupsPanel({ db }: { db: SupabaseClient }) {
  const { ok, fail, node } = useNotice()
  const [rows, setRows] = useState<Signup[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await db
      .from("yard_signups")
      .select("id, email, name, role, fanbase_name, fanbase_size, current_tools, created_at, show:shows(name)")
      .order("created_at", { ascending: false })
    if (error) fail("Couldn't load sign-ups.", error)
    setRows((data ?? []) as unknown as Signup[])
    setLoaded(true)
  }, [db, fail])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(
    () => ({ landlords: rows.filter((r) => r.role === "landlord").length, residents: rows.filter((r) => r.role === "resident").length }),
    [rows],
  )

  function exportCsv() {
    const header = ["Signed up", "Email", "Name", "Role", "Fanbase", "Show", "Size", "How they organise votes"]
    const lines = rows.map((r) =>
      [r.created_at, r.email, r.name, r.role === "landlord" ? "Runs a fanbase" : "Fan", r.fanbase_name, r.show?.name ?? null, r.fanbase_size ? SIZE_LABEL[r.fanbase_size] : null, r.current_tools]
        .map(csvCell)
        .join(","),
    )
    const blob = new Blob(["\ufeff" + [header.map(csvCell).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `yard-signups-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function remove(row: Signup) {
    if (!window.confirm(`Delete ${row.email} from the sign-up list? Use this for deletion requests. It can't be undone.`)) return
    const { error } = await db.from("yard_signups").delete().eq("id", row.id)
    if (error) return fail("Couldn't delete the sign-up.", error)
    ok(`${row.email} deleted.`)
    load()
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">Yard early-access sign-ups</h2>
        <p className="mt-1 text-sm text-contrast/70">
          Personal data: visible to admins only. Use it only to contact people about The Yard, and delete anyone who asks.
        </p>
        <p className="mt-4 text-sm text-contrast">
          <span className="font-bold">{rows.length}</span> {rows.length === 1 ? "sign-up" : "sign-ups"}:{" "}
          <span className="font-bold">{counts.landlords}</span> {counts.landlords === 1 ? "runs" : "run"} a fanbase,{" "}
          <span className="font-bold">{counts.residents}</span> {counts.residents === 1 ? "fan" : "fans"}.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={exportCsv} disabled={rows.length === 0}>
            Export to spreadsheet (CSV)
          </Button>
          <Button variant="secondary" onClick={load}>
            Refresh
          </Button>
        </div>
        <div className="mt-3">{node}</div>
      </Card>

      <Card>
        {!loaded ? (
          <p className="text-sm text-contrast/70">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-contrast/70">No sign-ups yet.</p>
        ) : (
          <ul className="divide-y divide-contrast/10">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-contrast">
                    {r.email}
                    {r.name && <span className="font-normal text-contrast/70"> · {r.name}</span>}
                  </p>
                  <p className="text-xs text-contrast/60">
                    {r.role === "landlord" ? "Runs a fanbase" : "Fan"}
                    {r.fanbase_name && ` · ${r.fanbase_name}`}
                    {r.show && ` · ${r.show.name}`}
                    {r.fanbase_size && ` · ${SIZE_LABEL[r.fanbase_size]}`} · {formatDate(r.created_at)}
                  </p>
                  {r.current_tools && <p className="mt-1 text-sm text-contrast/75">{r.current_tools}</p>}
                </div>
                <Button variant="danger" onClick={() => remove(r)} aria-label={`Delete ${r.email}`}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
