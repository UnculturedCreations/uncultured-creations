// Supabase Edge Function: delete-account
//
// Lets a signed-in fan delete their own account. The caller is identified from
// their sign-in token (sent as "Authorization: Bearer <token>"); the account and
// its profile are then deleted. Editor and admin accounts can't be deleted here,
// so nobody locks themselves out of the editor by accident.
// Deploy with "Verify JWT" turned OFF: this function checks the token itself.
// Supabase provides SUPABASE_URL and the secret key automatically; no other secrets.

import { createClient } from "npm:@supabase/supabase-js@2.118.0"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })
}

function secretKey(): string | undefined {
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS")
  if (keys) {
    try {
      const value = JSON.parse(keys)?.default
      if (value) return value
    } catch {
      // fall through to the legacy key
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors })
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" })

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? ""
  if (!token) return json(401, { error: "not_signed_in" })

  const key = secretKey()
  const url = Deno.env.get("SUPABASE_URL")
  if (!key || !url) return json(500, { error: "not_configured" })
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  // Who is asking? (Rejects expired or forged tokens.)
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  const user = userData?.user
  if (userError || !user) return json(401, { error: "not_signed_in" })

  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile && (profile.role === "editor" || profile.role === "admin")) {
    return json(403, { error: "staff_account" })
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error("deleteUser failed", error)
    return json(500, { error: "delete_failed" })
  }
  return json(200, { status: "deleted" })
})
