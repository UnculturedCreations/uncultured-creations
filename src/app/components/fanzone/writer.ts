"use client"

import type { SupabaseClient } from "@supabase/supabase-js"

export type Writer = { db: SupabaseClient; userId: string; ready: boolean; fanName: string | null } | null

// The signed-in fan, if any (loads the sign-in library only when a sign-in exists on this device).
export async function loadWriter(): Promise<Writer> {
  try {
    if (!localStorage.getItem("uc-auth")) return null
  } catch {
    return null
  }
  const { getFanClient } = await import("@/lib/supabaseFan")
  const db = getFanClient()
  if (!db) return null
  const { data } = await db.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) return null
  const { data: p } = await db.from("profiles").select("display_name, name_confirmed, adult_confirmed_at").eq("id", userId).maybeSingle()
  return { db, userId, ready: Boolean(p?.name_confirmed && p?.adult_confirmed_at), fanName: p?.display_name ?? null }
}

// Friendly messages for the database's writer rules.
export function writerError(message: string | undefined): string {
  if (message?.includes("too_many_pending")) return "You already have 3 waiting for review. Once an editor has looked at them, you can send more."
  if (message?.includes("published_locked")) return "Published work can't be changed. Contact the editors if something needs fixing."
  return "Something went wrong. Please try again."
}
