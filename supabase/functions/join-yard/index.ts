// Supabase Edge Function: join-yard
//
// Records an early-access sign-up for The Yard after checking the visitor
// with Cloudflare Turnstile. Uses the same secrets as cast-vote:
//   TURNSTILE_SECRET_KEY, TURNSTILE_ALLOWED_HOSTNAMES (optional)
// Deploy with "Verify JWT" turned OFF: visitors are anonymous; Turnstile protects it.

import { createClient } from "npm:@supabase/supabase-js@2.118.0"

// Overridable only for local testing; leave unset in Supabase.
const VERIFY_URL = Deno.env.get("TURNSTILE_VERIFY_URL") ?? "https://challenges.cloudflare.com/turnstile/v0/siteverify"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const ROLES = ["landlord", "resident"]
const SIZES = ["", "under_100", "100_1000", "1000_10000", "over_10000"]

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

function hostnameAllowed(hostname: string | undefined): boolean {
  const list = (Deno.env.get("TURNSTILE_ALLOWED_HOSTNAMES") ?? "").split(",").map((h) => h.trim()).filter(Boolean)
  if (list.length === 0) return true
  if (!hostname) return false
  return list.some((pattern) =>
    new RegExp("^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[a-z0-9-]*") + "$", "i").test(hostname),
  )
}

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "")

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors })
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json(400, { error: "invalid_json" })
  }

  const email = text(body.email, 254).toLowerCase()
  const role = text(body.role, 20)
  const size = text(body.fanbase_size, 20)
  const showId = text(body.show_id, 36)
  const token = typeof body.token === "string" ? body.token : ""
  if (!EMAIL.test(email) || !ROLES.includes(role) || !SIZES.includes(size) || (showId && !UUID.test(showId)) || body.adult !== true || !token || token.length > 2048) {
    return json(400, { error: "invalid_request" })
  }

  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY")
  const key = secretKey()
  const url = Deno.env.get("SUPABASE_URL")
  if (!turnstileSecret || !key || !url) return json(500, { error: "not_configured" })

  const form = new URLSearchParams({ secret: turnstileSecret, response: token })
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  if (ip) form.set("remoteip", ip)
  let verdict: { success?: boolean; hostname?: string }
  try {
    verdict = await (await fetch(VERIFY_URL, { method: "POST", body: form })).json()
  } catch {
    return json(502, { error: "verification_unavailable" })
  }
  if (!verdict.success || !hostnameAllowed(verdict.hostname)) return json(403, { error: "verification_failed" })

  const admin = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await admin.rpc("record_yard_signup", {
    p_email: email,
    p_name: text(body.name, 80),
    p_role: role,
    p_fanbase_name: text(body.fanbase_name, 80),
    p_show_id: showId || null,
    p_fanbase_size: size,
    p_current_tools: text(body.current_tools, 300),
  })
  if (error) {
    console.error("record_yard_signup failed", error)
    return json(500, { error: "signup_failed" })
  }
  if (data === "invalid") return json(400, { error: "invalid_request" })
  // Same response whether the email was new or already on the list, so the form can't be used to check who signed up.
  return json(200, { status: "ok" })
})
