// Supabase Edge Function: cast-vote
//
// Records one poll vote after checking the visitor with Cloudflare Turnstile.
// The browser sends: { poll_id, option_id, device_id, token }.
//
// Secrets (Supabase dashboard -> Edge Functions -> Secrets):
//   TURNSTILE_SECRET_KEY         required: the widget's secret key from Cloudflare
//   TURNSTILE_ALLOWED_HOSTNAMES  optional: comma-separated hostnames the vote may come
//                                from; "*" is a wildcard, e.g.
//                                uncultured-creations.vercel.app,uncultured-creations-*.vercel.app
// Supabase provides SUPABASE_URL and the secret key automatically.
// Deploy with "Verify JWT" turned OFF: visitors are anonymous; Turnstile protects it.

import { createClient } from "npm:@supabase/supabase-js@2.118.0"

// Overridable only for local testing; leave unset in Supabase.
const VERIFY_URL = Deno.env.get("TURNSTILE_VERIFY_URL") ?? "https://challenges.cloudflare.com/turnstile/v0/siteverify"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })
}

// Prefer the new secret key; fall back to the legacy service_role key.
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

function hostnameAllowed(hostname: string | undefined): boolean {
  const list = (Deno.env.get("TURNSTILE_ALLOWED_HOSTNAMES") ?? "").split(",").map((h) => h.trim()).filter(Boolean)
  if (list.length === 0) return true // rely on the widget's own hostname list in Cloudflare
  if (!hostname) return false
  return list.some((pattern) => {
    const regex = new RegExp("^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[a-z0-9-]*") + "$", "i")
    return regex.test(hostname)
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors })
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json(400, { error: "invalid_json" })
  }
  const { poll_id, option_id, device_id, token } = body
  if (
    typeof poll_id !== "string" || !UUID.test(poll_id) ||
    typeof option_id !== "string" || !UUID.test(option_id) ||
    typeof device_id !== "string" || device_id.length > 64 ||
    typeof token !== "string" || token.length === 0 || token.length > 2048
  ) {
    return json(400, { error: "invalid_request" })
  }

  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY")
  const key = secretKey()
  const url = Deno.env.get("SUPABASE_URL")
  if (!turnstileSecret || !key || !url) return json(500, { error: "not_configured" })

  // 1. Verify the visitor with Cloudflare.
  const form = new URLSearchParams({ secret: turnstileSecret, response: token })
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  if (ip) form.set("remoteip", ip)
  let verdict: { success?: boolean; hostname?: string }
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body: form })
    verdict = await res.json()
  } catch {
    return json(502, { error: "verification_unavailable" })
  }
  if (!verdict.success || !hostnameAllowed(verdict.hostname)) {
    return json(403, { error: "verification_failed" })
  }

  // 2. Record the vote (the database enforces one vote per device per poll).
  const admin = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await admin.rpc("record_vote", {
    p_poll_id: poll_id,
    p_option_id: option_id,
    p_device_id: device_id,
  })
  if (error) {
    console.error("record_vote failed", error)
    return json(500, { error: "vote_failed" })
  }
  const status = (data as { status?: string })?.status
  if (status === "closed") return json(409, { error: "poll_closed" })
  if (status === "invalid") return json(400, { error: "invalid_request" })
  return json(200, data)
})
