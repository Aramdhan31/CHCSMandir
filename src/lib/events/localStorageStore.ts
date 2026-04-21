import type { AdminEventItem } from "@/lib/events/types";

const STORAGE_KEY = "chcs_admin_events_v1";

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isEventLike(x: unknown): x is AdminEventItem {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.date === "string" &&
    typeof r.title === "string" &&
    (r.summary === undefined || typeof r.summary === "string") &&
    (r.imageSrc === undefined || typeof r.imageSrc === "string")
  );
}

export function loadAdminEvents(): AdminEventItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeParse(raw);
  if (!Array.isArray(parsed)) return [];
  const events = parsed.filter(isEventLike);
  return events;
}

export function saveAdminEvents(events: AdminEventItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

