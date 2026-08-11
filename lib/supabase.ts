import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

/** Server-only client. Accepts service role or new Supabase secret key. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) {
    cached = null;
    return null;
  }

  cached = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}

export function getSupabaseStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "generations";
}

export function isSupabaseStorageConfigured(): boolean {
  return getSupabaseAdmin() !== null;
}
