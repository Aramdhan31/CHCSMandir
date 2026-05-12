/** Calendar values in Europe/London (membership / temple context). */

export function londonCalendarYear(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
    }).format(now),
  );
}

/** e.g. "Tuesday 12 May 2026" — updates with the clock in London. */
export function formatLondonDateLong(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}
