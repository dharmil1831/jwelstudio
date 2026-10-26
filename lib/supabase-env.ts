/** Public project URL and the key used to start a user session. No database imports. */
export function supabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
}

export function supabaseAuthKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    null
  );
}
