"use server";

import { cookies } from "next/headers";
import { canManageEventsAdmin } from "@/lib/admin/eventsAccess";
import type { AdminEventItem } from "@/lib/events/types";
import { getSupabaseServiceRole } from "@/lib/supabase/service";
import { getNextBhajanSatsangEvent, getNextMonthlySatsangEvent } from "@/content/site";
import {
  canSyncGoogleCalendar,
  deleteGoogleCalendarEvent,
  upsertGoogleCalendarEvent,
} from "@/lib/events/googleCalendarSync";

const EVENTS_TABLE = "events";
const SYNC_MAP_TABLE = "google_calendar_sync_map";

function eventsBucket() {
  return process.env.SUPABASE_EVENTS_STORAGE_BUCKET?.trim() || "event-images";
}

async function assertEventsAdmin() {
  const jar = await cookies();
  if (!canManageEventsAdmin(jar)) throw new Error("Not signed in to events admin.");
}

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

function normalizeEventTime(raw: string | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  // Accept "HH:MM" from <input type="time"> or "HH:MM:SS" from API.
  const m = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return null;
  const hh = String(Number(m[1])).padStart(2, "0");
  const mm = m[2];
  return `${hh}:${mm}`;
}

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  date_label: string;
  summary: string | null;
  image_public_url: string | null;
  google_calendar_event_id?: string | null;
};

function rowToAdmin(row: EventRow): AdminEventItem {
  return {
    id: row.id,
    date: row.event_date,
    time: row.event_time ?? undefined,
    title: row.title,
    summary: row.summary ?? undefined,
    imageSrc: row.image_public_url ?? undefined,
  };
}

export async function listAdminEventsAction(): Promise<AdminEventItem[]> {
  await assertEventsAdmin();
  const sb = getSupabaseServiceRole();
  if (!sb) return [];

  const { data, error } = await sb
    .from(EVENTS_TABLE)
    .select(
      "id,title,event_date,event_time,date_label,summary,image_public_url,google_calendar_event_id",
    )
    .order("event_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as EventRow[] | null)?.map(rowToAdmin) ?? [];
}

type UpsertPayload = {
  id?: string;
  title: string;
  date: string;
  time?: string;
  summary?: string;
  imageSrc?: string;
  imageBase64?: string;
  imageFilename?: string;
  imageContentType?: string;
};

export async function upsertAdminEventAction(input: UpsertPayload): Promise<void> {
  await assertEventsAdmin();
  const sb = getSupabaseServiceRole();
  if (!sb) throw new Error("Events syncing is not configured on the server.");

  const id = input.id?.trim();
  const newRowId = id ?? crypto.randomUUID();
  const title = input.title.trim();
  const eventDate = input.date.trim();
  if (!title || !eventDate) throw new Error("Title and date are required.");
  const eventTime = normalizeEventTime(input.time);

  let imageUrl = input.imageSrc?.trim() || null;

  if (input.imageBase64 && input.imageFilename) {
    const buffer = Buffer.from(input.imageBase64, "base64");
    const safeName = input.imageFilename.replace(/[^\w.\-]+/g, "_");
    const objectId = `${newRowId}/${Date.now()}_${safeName}`;
    const bucket = eventsBucket();
    const { error: upErr } = await sb.storage.from(bucket).upload(objectId, buffer, {
      contentType: input.imageContentType || "application/octet-stream",
      upsert: true,
    });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = sb.storage.from(bucket).getPublicUrl(objectId);
    imageUrl = pub.publicUrl;
  }

  const dateLabelBase = formatDateLabel(eventDate);
  const dateLabel = eventTime ? `${dateLabelBase} · ${formatTimeLabel(eventTime)}` : dateLabelBase;
  const row = {
    title,
    event_date: eventDate,
    event_time: eventTime,
    date_label: dateLabel,
    summary: input.summary?.trim() ? input.summary.trim() : null,
    image_public_url: imageUrl,
    published: true,
  };

  if (id) {
    const { error } = await sb.from(EVENTS_TABLE).update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from(EVENTS_TABLE).insert({ id: newRowId, ...row });
    if (error) throw new Error(error.message);
  }

  // Sync to the shared Mandir Google Calendar so subscribers get updates.
  // If creds are missing, we keep website events working and just skip calendar sync.
  if (!canSyncGoogleCalendar()) return;

  const { data: rows, error: selErr } = await sb
    .from(EVENTS_TABLE)
    .select("id,title,event_date,event_time,summary,google_calendar_event_id")
    .eq("id", newRowId)
    .limit(1);
  if (selErr) throw new Error(selErr.message);
  const current = (rows?.[0] ?? null) as
    | (Pick<
        EventRow,
        "id" | "title" | "event_date" | "event_time" | "summary" | "google_calendar_event_id"
      > & { google_calendar_event_id?: string | null })
    | null;
  if (!current) return;

  try {
    const { googleEventId } = await upsertGoogleCalendarEvent({
      input: {
        id: current.id,
        title: current.title,
        dateIso: current.event_date,
        time: current.event_time,
        summary: current.summary,
      },
      existingGoogleEventId: current.google_calendar_event_id ?? null,
    });
    await sb
      .from(EVENTS_TABLE)
      .update({
        google_calendar_event_id: googleEventId,
        google_calendar_synced_at: new Date().toISOString(),
        google_calendar_last_error: null,
      })
      .eq("id", current.id);
  } catch (e) {
    await sb
      .from(EVENTS_TABLE)
      .update({
        google_calendar_last_error: e instanceof Error ? e.message : String(e),
      })
      .eq("id", current.id);
    // Don't fail the admin save if Google Calendar is temporarily down.
  }
}

export async function deleteAdminEventAction(id: string): Promise<void> {
  await assertEventsAdmin();
  const sb = getSupabaseServiceRole();
  if (!sb) throw new Error("Events syncing is not configured on the server.");

  if (canSyncGoogleCalendar()) {
    const { data: rows } = await sb
      .from(EVENTS_TABLE)
      .select("google_calendar_event_id")
      .eq("id", id)
      .limit(1);
    const googleId = (rows?.[0] as { google_calendar_event_id?: string | null } | undefined)
      ?.google_calendar_event_id;
    if (googleId?.trim()) {
      try {
        await deleteGoogleCalendarEvent(googleId);
      } catch {
        // Best-effort. We still allow deletion from the website DB.
      }
    }
  }
  const { error } = await sb.from(EVENTS_TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function syncAllEventsToGoogleCalendarAction(): Promise<{
  synced: number;
  updated: number;
  skipped: number;
  errors: number;
}> {
  await assertEventsAdmin();
  const sb = getSupabaseServiceRole();
  if (!sb) throw new Error("Events syncing is not configured on the server.");
  if (!canSyncGoogleCalendar()) {
    throw new Error(
      "Google Calendar sync is not configured (missing env vars). Add GOOGLE_CALENDAR_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
    );
  }

  const { data, error } = await sb
    .from(EVENTS_TABLE)
    .select("id,title,event_date,event_time,summary,google_calendar_event_id")
    .eq("published", true)
    .order("event_date", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  let synced = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const rows = ((data as EventRow[] | null) ?? []).filter(
    (r) => r.id && r.title && r.event_date,
  );
  for (const r of rows) {
    try {
      const had = Boolean(r.google_calendar_event_id?.trim());
      const { googleEventId } = await upsertGoogleCalendarEvent({
        input: {
          id: r.id,
          title: r.title,
          dateIso: r.event_date,
          time: r.event_time,
          summary: r.summary,
        },
        existingGoogleEventId: r.google_calendar_event_id ?? null,
      });
      await sb
        .from(EVENTS_TABLE)
        .update({
          google_calendar_event_id: googleEventId,
          google_calendar_synced_at: new Date().toISOString(),
          google_calendar_last_error: null,
        })
        .eq("id", r.id);
      if (had) updated += 1;
      else synced += 1;
    } catch (e) {
      errors += 1;
      await sb
        .from(EVENTS_TABLE)
        .update({
          google_calendar_last_error: e instanceof Error ? e.message : String(e),
        })
        .eq("id", r.id);
    }
  }

  // Also sync the next occurrences for recurring cards (they are not stored in `public.events`).
  // These are best-effort, but we persist Google ids in `google_calendar_sync_map` to avoid duplicates.
  const recurring = [getNextMonthlySatsangEvent(), getNextBhajanSatsangEvent()];
  for (const ev of recurring) {
    if (!ev.dateIso) {
      skipped += 1;
      continue;
    }
    const key = `recurring:${ev.title}:${ev.dateIso}`;
    let existing: string | null = null;
    try {
      const { data: mapRows } = await sb
        .from(SYNC_MAP_TABLE)
        .select("google_event_id")
        .eq("key", key)
        .limit(1);
      existing =
        (mapRows?.[0] as { google_event_id?: string | null } | undefined)?.google_event_id ??
        null;
      const { googleEventId } = await upsertGoogleCalendarEvent({
        input: {
          id: key,
          title: ev.title,
          dateIso: ev.dateIso,
          time: ev.time ?? null,
          summary: ev.summary ?? null,
        },
        existingGoogleEventId: existing ?? null,
      });
      await sb.from(SYNC_MAP_TABLE).upsert({
        key,
        google_event_id: googleEventId,
        synced_at: new Date().toISOString(),
        last_error: null,
      });
      if (existing) updated += 1;
      else synced += 1;
    } catch (e) {
      errors += 1;
      await sb.from(SYNC_MAP_TABLE).upsert({
        key,
        google_event_id: existing ?? null,
        synced_at: new Date().toISOString(),
        last_error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { synced, updated, skipped, errors };
}
