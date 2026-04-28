import { visit } from "@/content/site";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymdCompact(isoDate: string) {
  // isoDate: YYYY-MM-DD
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return `${m[1]}${m[2]}${m[3]}`;
}

function hmFromTime(raw: string) {
  const t = raw.trim();
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { hh, mm };
}

function addMinutes(hh: number, mm: number, minutes: number) {
  const total = hh * 60 + mm + minutes;
  const next = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return { hh: Math.floor(next / 60), mm: next % 60 };
}

function mandirLocation() {
  const address = visit.addressLines.join(", ");
  return `${visit.sectionTitle === "Visit us" ? "CHCS Mandir" : "CHCS"}, ${address}`;
}

/**
 * Google Calendar "TEMPLATE" URL with prefilled data.
 * - If time is omitted, creates an all-day event.
 * - If time is provided, creates a timed event in Europe/London, default duration 2 hours.
 */
export function buildGoogleCalendarTemplateUrl(input: {
  title: string;
  dateIso: string; // YYYY-MM-DD
  time?: string | null; // HH:MM or HH:MM:SS
  details?: string;
}) {
  const date = ymdCompact(input.dateIso);
  if (!date) return null;

  const params = new URLSearchParams();
  params.set("action", "TEMPLATE");
  params.set("text", input.title);
  params.set("location", mandirLocation());
  params.set("ctz", "Europe/London");

  const detailsBits: string[] = [];
  if (input.details?.trim()) detailsBits.push(input.details.trim());
  detailsBits.push(`Address: ${visit.addressLines.join(", ")}`);
  detailsBits.push(`Email: ${visit.email}`);
  params.set("details", detailsBits.join("\n"));

  const time = input.time ? hmFromTime(input.time) : null;
  if (!time) {
    // all-day: end date is exclusive, so +1 day
    // google accepts YYYYMMDD/YYYYMMDD
    // We'll compute +1 day via UTC noon to avoid TZ edge-cases.
    const d = new Date(Date.UTC(Number(input.dateIso.slice(0, 4)), Number(input.dateIso.slice(5, 7)) - 1, Number(input.dateIso.slice(8, 10)), 12));
    d.setUTCDate(d.getUTCDate() + 1);
    const end = `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
    params.set("dates", `${date}/${end}`);
  } else {
    const start = `${date}T${pad2(time.hh)}${pad2(time.mm)}00`;
    const endHm = addMinutes(time.hh, time.mm, 120);
    const end = `${date}T${pad2(endHm.hh)}${pad2(endHm.mm)}00`;
    params.set("dates", `${start}/${end}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsDownloadUrl(input: {
  title: string;
  dateIso: string; // YYYY-MM-DD
  time?: string | null; // HH:MM or HH:MM:SS
  summary?: string;
}) {
  const date = ymdCompact(input.dateIso);
  if (!date) return null;
  const params = new URLSearchParams();
  params.set("title", input.title);
  params.set("date", input.dateIso);
  if (input.time?.trim()) params.set("time", input.time.trim());
  if (input.summary?.trim()) params.set("summary", input.summary.trim());
  return `/events/ics?${params.toString()}`;
}

