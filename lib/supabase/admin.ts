import { createClient } from "@supabase/supabase-js";

/**
 * Server-only admin client. Bypasses RLS.
 * Requires SUPABASE_SERVICE_ROLE_KEY — never expose to browser.
 * Falls back to anon key if service role not set (requires RLS to be disabled).
 */
export function supabaseAdmin() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
