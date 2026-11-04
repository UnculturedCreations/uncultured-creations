"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Browser-side Supabase client for the editor area. Unlike the public client
// (src/lib/supabase.ts) it keeps the editor signed in between visits.
// Access is still decided by the database's security rules and the editor role.
let client: SupabaseClient | null = null

export function getBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null
  client ??= createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "uc-editor-auth" },
  })
  return client
}
