// Supabase Edge Function: react
//
// Records a reader's reaction to an approved fan fiction story (one per device,
// changeable) after checking the visitor with Cloudflare Turnstile. Same secrets as cast-vote:
//   TURNSTILE_SECRET_KEY, TURNSTILE_ALLOWED_HOSTNAMES (optional)
// Deploy with "Verify JWT" turned OFF: visitors are anonymous; Turnstile protects it.

import { createClient } from "npm:@supabase/supabase-js@2.118.0"

// Overridable only for local testing; leave unset in Supabase.
const VERIFY_URL = Deno.env.get("TURNSTILE_VERIFY_URL") ?? "https://challenges.cloudflare.com/turnstile/v0/siteverify"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const REACTIONS = ["love", "laugh", "wow", "sad", "fire"]

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors })
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json(400, { error: "invalid_json" })
  }
  const { story_id, reaction, device_id, token } = body
  if (
    typeof story_id !== "string" || !UUID.test(story_id) ||
    typeof reaction !== "string" || !REACTIONS.includes(reaction) ||
    typeof device_id !== "string" || device_id.length > 64 ||
    typeof token !== "string" || !token || token.length > 2048
  ) {
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
  const { data, error } = await admin.rpc("record_story_reaction", { p_story_id: story_id, p_reaction: reaction, p_device_id: device_id })
  if (error) {
    console.error("record_story_reaction failed", error)
    return json(500, { error: "reaction_failed" })
  }
  if ((data as { status?: string })?.status !== "ok") return json(400, { error: "invalid_request" })
  return json(200, data)
})
