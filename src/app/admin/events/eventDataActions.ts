"use server";

import { cookies } from "next/headers";
import { canManageEventsAdmin } from "@/lib/admin/eventsAccess";
import type { AdminEventItem } from "@/lib/events/types";
import { getSupabaseServiceRole } from "@/lib/supabase/service";

const EVENTS_TABLE = "events";

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

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  date_label: string;
  summary: string | null;
  image_public_url: string | null;
};

function rowToAdmin(row: EventRow): AdminEventItem {
  return {
    id: row.id,
    date: row.event_date,
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
    .select("id,title,event_date,date_label,summary,image_public_url")
    .order("event_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as EventRow[] | null)?.map(rowToAdmin) ?? [];
}

type UpsertPayload = {
  id?: string;
  title: string;
  date: string;
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

  const dateLabel = formatDateLabel(eventDate);
  const row = {
    title,
    event_date: eventDate,
    date_label: dateLabel,
    summary: input.summary?.trim() ? input.summary.trim() : null,
    image_public_url: imageUrl,
    published: true,
  };

  if (id) {
    const { error } = await sb.from(EVENTS_TABLE).update(row).eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await sb.from(EVENTS_TABLE).insert({ id: newRowId, ...row });
  if (error) throw new Error(error.message);
}

export async function deleteAdminEventAction(id: string): Promise<void> {
  await assertEventsAdmin();
  const sb = getSupabaseServiceRole();
  if (!sb) throw new Error("Events syncing is not configured on the server.");
  const { error } = await sb.from(EVENTS_TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
