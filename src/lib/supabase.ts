import { createClient } from "@supabase/supabase-js"

// Public connection to the Reality Reloaded database.
// Both values are designed to be public: what visitors can read or change is
// enforced by the database's row-level security rules (see supabase/migrations).
// Never put the secret (service_role) key in this project.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && publishableKey)

// null when the environment variables are missing, so pages can show a
// friendly fallback instead of crashing (for example on a fresh clone).
export const supabase = isSupabaseConfigured
  ? createClient(url as string, publishableKey as string, {
      auth: { persistSession: false },
    })
  : null
