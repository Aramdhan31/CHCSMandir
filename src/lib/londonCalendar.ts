/** Calendar values in Europe/London (membership / temple context). */

export function londonCalendarYear(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
    }).format(now),
  );
}

const londonDateLongFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((p) => p.type === type)?.value ?? "";
}

/** e.g. "Tuesday 12 May 2026" — stable on server and browser (no ICU comma differences). */
export function formatLondonDateLong(now = new Date()): string {
  const p = londonDateLongFormatter.formatToParts(now);
  return `${part(p, "weekday")} ${part(p, "day")} ${part(p, "month")} ${part(p, "year")}`;
}
