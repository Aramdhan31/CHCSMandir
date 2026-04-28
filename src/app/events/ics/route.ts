import { NextResponse } from "next/server";
import { visit } from "@/content/site";

function safeText(s: string) {
  return s.replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymdCompact(isoDate: string) {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { y: m[1], m: m[2], d: m[3], compact: `${m[1]}${m[2]}${m[3]}` };
}

function hmFromTime(raw: string | null) {
  const t = (raw ?? "").trim();
  if (!t) return null;
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const title = (url.searchParams.get("title") ?? "").trim();
  const dateIso = (url.searchParams.get("date") ?? "").trim();
  const time = url.searchParams.get("time"); // optional
  const summary = (url.searchParams.get("summary") ?? "").trim();

  if (!title) return new NextResponse("Missing title", { status: 400 });
  const d = ymdCompact(dateIso);
  if (!d) return new NextResponse("Missing/invalid date", { status: 400 });

  const location = `CHCS Mandir, ${visit.addressLines.join(", ")}`;
  const detailsBits: string[] = [];
  if (summary) detailsBits.push(summary);
  detailsBits.push(`Address: ${visit.addressLines.join(", ")}`);
  detailsBits.push(`Email: ${visit.email}`);
  const description = detailsBits.join("\n");

  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}T${pad2(
    now.getUTCHours(),
  )}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;

  const hm = hmFromTime(time);
  const uid = `${d.compact}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}@chcstemple.org`;

  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//CHCS Mandir//Events//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${uid}`);
  lines.push(`DTSTAMP:${dtstamp}`);
  lines.push(`SUMMARY:${safeText(title)}`);
  lines.push(`LOCATION:${safeText(location)}`);
  lines.push(`DESCRIPTION:${safeText(description)}`);

  if (!hm) {
    // all-day
    lines.push(`DTSTART;VALUE=DATE:${d.compact}`);
    // DTEND is exclusive: +1 day
    const end = new Date(Date.UTC(Number(d.y), Number(d.m) - 1, Number(d.d), 12));
    end.setUTCDate(end.getUTCDate() + 1);
    const endCompact = `${end.getUTCFullYear()}${pad2(end.getUTCMonth() + 1)}${pad2(end.getUTCDate())}`;
    lines.push(`DTEND;VALUE=DATE:${endCompact}`);
  } else {
    const endHm = addMinutes(hm.hh, hm.mm, 120);
    lines.push(`DTSTART;TZID=Europe/London:${d.compact}T${pad2(hm.hh)}${pad2(hm.mm)}00`);
    lines.push(`DTEND;TZID=Europe/London:${d.compact}T${pad2(endHm.hh)}${pad2(endHm.mm)}00`);
  }

  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  const body = lines.join("\r\n") + "\r\n";
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event"}.ics`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

