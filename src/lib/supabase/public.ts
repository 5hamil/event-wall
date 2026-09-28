import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** A cookie-free anon client for public pages: it never reads or restores a user's session. */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase public credentials are not configured.");

  return createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
