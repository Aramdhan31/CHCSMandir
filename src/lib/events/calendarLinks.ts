function ymdCompact(isoDate: string) {
  // isoDate: YYYY-MM-DD
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return `${m[1]}${m[2]}${m[3]}`;
}

/** Same query string as `/events/ics`; opens or downloads `.ics` for the device’s calendar app. */
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
