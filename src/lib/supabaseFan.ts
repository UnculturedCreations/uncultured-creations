"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Browser-side Supabase client for fan accounts (separate from the editor's sign-in).
// Only loaded on pages that need it, such as /account, so other pages stay light.
export const FAN_AUTH_KEY = "uc-auth"
let client: SupabaseClient | null = null

export function getFanClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null
  client ??= createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce", storageKey: FAN_AUTH_KEY },
  })
  return client
}
