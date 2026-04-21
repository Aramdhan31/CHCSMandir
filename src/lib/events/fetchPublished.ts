import type { SiteEventItem } from "@/content/site";
import { createSupabaseAnonServerClient } from "@/lib/supabase/serverAnon";

type EventRow = {
  title: string;
  date_label: string;
  summary: string | null;
  image_public_url: string | null;
};

/**
 * Reads **published** rows from `public.events` using the anon key (RLS must allow select).
 */
export async function fetchPublishedSupabaseEvents(): Promise<SiteEventItem[]> {
  const sb = await createSupabaseAnonServerClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("events")
    .select("title,date_label,summary,image_public_url")
    .eq("published", true)
    .order("event_date", { ascending: false })
    .limit(50);

  if (error) return [];

  return ((data as EventRow[] | null) ?? []).map((row) => ({
    dateLabel: row.date_label,
    title: row.title,
    summary: row.summary ?? undefined,
    imageSrc: row.image_public_url ?? undefined,
  }));
}
