import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

let browserClient: SupabaseClient | undefined;

/**
 * Browser Supabase client (uses the anon key). Call only when `supabaseEnvConfigured()` is true.
 * Set both env vars in `.env.local` (or the host’s env) and restart the dev server.
 */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  browserClient ??= createClient(url, anonKey);
  return browserClient;
}

export function supabaseEnvConfigured(): boolean {
  return Boolean(url && anonKey);
}
