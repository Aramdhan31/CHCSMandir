import crypto from "crypto";

type GoogleCalendarSyncInput = {
  /** Supabase `events.id` (used as stable external id in Google). */
  id: string;
  title: string;
  dateIso: string; // YYYY-MM-DD
  time?: string | null; // HH:MM or HH:MM:SS
  summary?: string | null;
};

function env(name: string) {
  return process.env[name]?.trim() || null;
}

function googleCalendarId() {
  // Prefer dedicated env; fallback to the existing constant used for embeds.
  return env("GOOGLE_CALENDAR_ID") || env("NEXT_PUBLIC_MANDIR_CALENDAR_ID") || null;
}

function serviceAccountEmail() {
  return env("GOOGLE_SERVICE_ACCOUNT_EMAIL");
}

function serviceAccountPrivateKey() {
  const raw = env("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  if (!raw) return null;
  // Many hosts store multiline secrets with literal '\n'.
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function jwtSignRs256(payload: object, privateKeyPem: string) {
  const header = { alg: "RS256", typ: "JWT" };
  const data = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(data);
  signer.end();
  const signature = signer.sign(privateKeyPem);
  return `${data}.${base64url(signature)}`;
}

async function fetchAccessToken(): Promise<string> {
  const email = serviceAccountEmail();
  const key = serviceAccountPrivateKey();
  if (!email || !key) throw new Error("Missing Google service account credentials.");

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwtSignRs256(
    {
      iss: email,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 60 * 60,
    },
    key,
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });
  if (!res.ok) throw new Error(`Google token error (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Google token response missing access_token.");
  return json.access_token;
}

function addMinutes(hh: number, mm: number, minutes: number) {
  const total = hh * 60 + mm + minutes;
  const next = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return { hh: Math.floor(next / 60), mm: next % 60 };
}

function hmFromTime(raw: string | null | undefined) {
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

function addDaysIso(dateIso: string, days: number) {
  const t = Date.parse(`${dateIso}T12:00:00Z`);
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function googleEventBody(input: GoogleCalendarSyncInput) {
  const hm = hmFromTime(input.time);
  const descriptionBits: string[] = [
    "Type: CHCS event (website/admin)",
    input.summary?.trim() ? `Notes: ${input.summary.trim()}` : "",
  ].filter(Boolean);

  const base = {
    summary: `CHCS: ${input.title}`,
    description: descriptionBits.join("\n"),
    // stable id we can search later if needed
    extendedProperties: { private: { chcs_event_id: input.id } },
  } as Record<string, unknown>;

  if (!hm) {
    const end = addDaysIso(input.dateIso, 1);
    return {
      ...base,
      start: { date: input.dateIso },
      end: { date: end ?? input.dateIso },
    };
  }

  const endHm = addMinutes(hm.hh, hm.mm, 120);
  const startDateTime = `${input.dateIso}T${String(hm.hh).padStart(2, "0")}:${String(hm.mm).padStart(2, "0")}:00`;
  const endDateTime = `${input.dateIso}T${String(endHm.hh).padStart(2, "0")}:${String(endHm.mm).padStart(2, "0")}:00`;
  return {
    ...base,
    start: { dateTime: startDateTime, timeZone: "Europe/London" },
    end: { dateTime: endDateTime, timeZone: "Europe/London" },
  };
}

function requireCalendarId() {
  const id = googleCalendarId();
  if (!id) throw new Error("Missing GOOGLE_CALENDAR_ID.");
  return id;
}

export function canSyncGoogleCalendar() {
  return Boolean(googleCalendarId() && serviceAccountEmail() && serviceAccountPrivateKey());
}

export async function upsertGoogleCalendarEvent(args: {
  input: GoogleCalendarSyncInput;
  existingGoogleEventId?: string | null;
}): Promise<{ googleEventId: string }> {
  const calendarId = requireCalendarId();
  const token = await fetchAccessToken();
  const body = googleEventBody(args.input);

  if (args.existingGoogleEventId?.trim()) {
    const evId = encodeURIComponent(args.existingGoogleEventId.trim());
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${evId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) throw new Error(`Google calendar update failed (${res.status}): ${await res.text()}`);
    const json = (await res.json()) as { id?: string };
    if (!json.id) throw new Error("Google calendar update: missing id in response.");
    return { googleEventId: json.id };
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`Google calendar insert failed (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as { id?: string };
  if (!json.id) throw new Error("Google calendar insert: missing id in response.");
  return { googleEventId: json.id };
}

export async function deleteGoogleCalendarEvent(googleEventId: string): Promise<void> {
  const calendarId = requireCalendarId();
  const token = await fetchAccessToken();
  const evId = encodeURIComponent(googleEventId.trim());
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${evId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  // Google returns 204 for success; 404 if already gone (fine).
  if (res.status === 404) return;
  if (!res.ok) throw new Error(`Google calendar delete failed (${res.status}): ${await res.text()}`);
}

