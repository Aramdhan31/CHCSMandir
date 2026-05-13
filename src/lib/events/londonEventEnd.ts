function getLondonTodayParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
  };
}

function parseIsoDate(iso: string) {
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function dateKey(y: number, m: number, d: number) {
  return y * 10000 + m * 100 + d;
}

/** Same rule as the home events grid: ended the day after the event (London calendar date). */
export function isEventEndedLondon(input: { dateIso?: string; time?: string }) {
  if (!input.dateIso) return false;
  const eventDate = parseIsoDate(input.dateIso);
  if (!eventDate) return false;

  const now = getLondonTodayParts();
  const todayKey = dateKey(now.y, now.m, now.d);
  const eventKey = dateKey(eventDate.y, eventDate.m, eventDate.d);

  return eventKey < todayKey;
}

/** Whole calendar days (Europe/London) since `dateIso`; `1` = first day after the event. */
export function daysAfterEventLondon(dateIso?: string): number | null {
  if (!dateIso) return null;
  const eventDate = parseIsoDate(dateIso);
  if (!eventDate) return null;
  const now = getLondonTodayParts();
  const tEv = Date.UTC(eventDate.y, eventDate.m - 1, eventDate.d);
  const tNow = Date.UTC(now.y, now.m - 1, now.d);
  return Math.floor((tNow - tEv) / 86400000);
}
