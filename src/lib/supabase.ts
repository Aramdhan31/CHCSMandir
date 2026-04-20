import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

/**
 * Browser Supabase client (uses the anon key). Use only in `"use client"` components.
 * Set both env vars in `.env.local` and restart `npm run dev`.
 */
export const supabase = createClient(url, anonKey);

export function supabaseEnvConfigured(): boolean {
  return Boolean(url && anonKey);
}
