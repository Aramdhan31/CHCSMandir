"use server";

import { cookies } from "next/headers";
import { canManageEventsAdmin } from "@/lib/admin/eventsAccess";
import type { AdminEventItem, AdminRecurringSetting, RecurringEventKind } from "@/lib/events/types";
import { getSupabaseServiceRole } from "@/lib/supabase/service";

const EVENTS_TABLE = "events";
const RECURRING_TABLE = "recurring_event_settings";

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
    .select("id,title,event_date,event_time,date_label,summary,image_public_url")
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
  if (!sb) throw new Error("Events are not configured on the server (Supabase).");

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
}

export async function deleteAdminEventAction(id: string): Promise<void> {
  await assertEventsAdmin();
  const sb = getSupabaseServiceRole();
  if (!sb) throw new Error("Events are not configured on the server (Supabase).");

  const { error } = await sb.from(EVENTS_TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

type RecurringRow = {
  kind: string;
  use_automatic_next: boolean;
  override_event_date: string | null;
  override_event_time: string | null;
  hidden_from_site: boolean;
};

function timeToAdminInput(t: string | null | undefined): string {
  if (!t) return "";
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  return `${String(Number(m[1])).padStart(2, "0")}:${m[2]}`;
}

const defaultRecurringRows = (): AdminRecurringSetting[] => [
  {
    kind: "monthly_satsang",
    use_automatic_next: true,
    override_event_date: "",
    override_event_time: "",
    hidden_from_site: false,
  },
  {
    kind: "bhajan_satsang",
    use_automatic_next: true,
    override_event_date: "",
    override_event_time: "",
    hidden_from_site: false,
  },
];

export async function listAdminRecurringSettingsAction(): Promise<AdminRecurringSetting[]> {
  await assertEventsAdmin();
  const sb = getSupabaseServiceRole();
  const base = defaultRecurringRows();
  if (!sb) return base;

  const { data, error } = await sb
    .from(RECURRING_TABLE)
    .select("kind,use_automatic_next,override_event_date,override_event_time,hidden_from_site");

  if (error) throw new Error(error.message);
  const map = new Map((data as RecurringRow[] | null)?.map((r) => [r.kind, r]) ?? []);
  return base.map((def) => {
    const row = map.get(def.kind);
    if (!row) return def;
    return {
      kind: def.kind,
      use_automatic_next: row.use_automatic_next,
      hidden_from_site: row.hidden_from_site,
      override_event_date: row.override_event_date?.trim() ?? "",
      override_event_time: timeToAdminInput(row.override_event_time),
    };
  });
}

type RecurringUpsertPayload = {
  kind: RecurringEventKind;
  use_automatic_next: boolean;
  hidden_from_site: boolean;
  override_event_date?: string;
  override_event_time?: string;
};

export async function upsertAdminRecurringSettingAction(input: RecurringUpsertPayload): Promise<void> {
  await assertEventsAdmin();
  const sb = getSupabaseServiceRole();
  if (!sb) throw new Error("Events are not configured on the server (Supabase).");

  const useAuto = input.use_automatic_next;
  const dateRaw = (input.override_event_date ?? "").trim();
  const timeNorm = normalizeEventTime(input.override_event_time);

  if (!useAuto && !dateRaw && !input.hidden_from_site) {
    throw new Error("When manual control is on, choose the next event date (or switch back to automatic).");
  }

  const row = {
    kind: input.kind,
    use_automatic_next: useAuto,
    hidden_from_site: input.hidden_from_site,
    override_event_date: useAuto ? null : dateRaw,
    override_event_time: useAuto ? null : timeNorm,
    updated_at: new Date().toISOString(),
  };

  const { error } = await sb.from(RECURRING_TABLE).upsert(row, { onConflict: "kind" });
  if (error) throw new Error(error.message);
}
