import type { SiteEventItem } from "@/content/site";
import { createSupabaseAnonServerClient } from "@/lib/supabase/serverAnon";

type EventRow = {
  title: string;
  event_date: string;
  event_time: string | null;
  date_label: string;
  summary: string | null;
  image_public_url: string | null;
};

function formatDateLabel(iso: string) {
  const t = Date.parse(`${iso}T12:00:00`);
  if (Number.isNaN(t)) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(t);
}

function formatTimeLabel(raw: string) {
  const t = raw.trim();
  if (!t) return "";
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t;
  let h = Number(m[1]);
  const min = m[2];
  if (!Number.isFinite(h)) return t;
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${min}${ampm}`;
}

function eventDateLabel(row: EventRow) {
  const base = row.event_date ? formatDateLabel(row.event_date) : row.date_label;
  if (!row.event_time) return base || row.date_label;
  return `${base} · ${formatTimeLabel(row.event_time)}`;
}

/**
 * Reads **published** rows from `public.events` using the anon key (RLS must allow select).
 */
export async function fetchPublishedSupabaseEvents(): Promise<SiteEventItem[]> {
  const sb = await createSupabaseAnonServerClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("events")
    .select("title,event_date,event_time,date_label,summary,image_public_url")
    .eq("published", true)
    .order("event_date", { ascending: false })
    .limit(50);

  if (error) return [];

  return ((data as EventRow[] | null) ?? []).map((row) => ({
    dateLabel: eventDateLabel(row),
    title: row.title,
    summary: row.summary ?? undefined,
    imageSrc: row.image_public_url ?? undefined,
  }));
}
