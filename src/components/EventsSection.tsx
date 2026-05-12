import {
  events,
  getNextMonthlySatsangEvent,
  getNextBhajanSatsangEvent,
  getMandirCalendarEmbedSrc,
  getMandirCalendarIcalUrl,
  getMandirCalendarWebcalUrl,
  mandirCalendar,
  recurringEventTitles,
} from "@/content/site";
import { fetchPublishedSupabaseEvents } from "@/lib/events/fetchPublished";
import { EventPosterCard } from "@/components/EventPosterCard";

function getLondonNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    hh: Number(get("hour")),
    mm: Number(get("minute")),
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

function isEventEnded(input: { dateIso?: string; time?: string }) {
  if (!input.dateIso) return false;
  const eventDate = parseIsoDate(input.dateIso);
  if (!eventDate) return false;

  const now = getLondonNow();
  const todayKey = dateKey(now.y, now.m, now.d);
  const eventKey = dateKey(eventDate.y, eventDate.m, eventDate.d);

  // Only mark ended the day AFTER the event date.
  return eventKey < todayKey;
}

/** Whole calendar days (Europe/London date) since `dateIso`; `1` = first day after the event. */
function daysAfterEventLondon(dateIso?: string): number | null {
  if (!dateIso) return null;
  const eventDate = parseIsoDate(dateIso);
  if (!eventDate) return null;
  const now = getLondonNow();
  const tEv = Date.UTC(eventDate.y, eventDate.m - 1, eventDate.d);
  const tNow = Date.UTC(now.y, now.m - 1, now.d);
  return Math.floor((tNow - tEv) / 86400000);
}

function isArchivedToPrevious(ev: { dateIso?: string }) {
  if (!isEventEnded(ev)) return false;
  const d = daysAfterEventLondon(ev.dateIso);
  if (d === null) return false;
  return d > events.archiveGraceDaysAfterEventDate;
}

function isOnMainGrid(ev: { dateIso?: string }) {
  if (!isEventEnded(ev)) return true;
  const d = daysAfterEventLondon(ev.dateIso);
  if (d === null) return true;
  return d <= events.archiveGraceDaysAfterEventDate;
}

export async function EventsSection() {
  const remoteItemsRaw = await fetchPublishedSupabaseEvents();
  const remoteItems = remoteItemsRaw.filter(
    (ev) =>
      ev.title !== recurringEventTitles.monthlySatsang &&
      ev.title !== recurringEventTitles.bhajanSatsang,
  );
  const recurringMonthly = getNextMonthlySatsangEvent();
  const recurringBhajan = getNextBhajanSatsangEvent();
  const cardItemsRaw = [
    recurringMonthly,
    recurringBhajan,
    ...remoteItems,
    ...events.items,
  ];

  const cardItems = [...cardItemsRaw].sort((a, b) => {
    const ad = a.dateIso?.trim() || "";
    const bd = b.dateIso?.trim() || "";
    if (ad && bd) {
      const c = ad.localeCompare(bd);
      if (c !== 0) return c;
      const at = a.time?.trim() || "";
      const bt = b.time?.trim() || "";
      return at.localeCompare(bt);
    }
    if (ad) return -1;
    if (bd) return 1;
    return a.title.localeCompare(b.title);
  });

  const mainGridItems = cardItems.filter(isOnMainGrid).sort((a, b) => {
    const aEnded = isEventEnded(a);
    const bEnded = isEventEnded(b);
    if (aEnded !== bEnded) return aEnded ? 1 : -1;

    const ad = a.dateIso?.trim() || "";
    const bd = b.dateIso?.trim() || "";
    if (ad && bd) {
      const c = ad.localeCompare(bd);
      if (c !== 0) return c;
      const at = a.time?.trim() || "";
      const bt = b.time?.trim() || "";
      return at.localeCompare(bt);
    }
    if (ad) return -1;
    if (bd) return 1;
    return a.title.localeCompare(b.title);
  });

  const previousItems = cardItems
    .filter(isArchivedToPrevious)
    .sort((a, b) => {
      const ad = a.dateIso?.trim() || "";
      const bd = b.dateIso?.trim() || "";
      if (ad && bd) {
        const c = bd.localeCompare(ad);
        if (c !== 0) return c;
        const at = a.time?.trim() || "";
        const bt = b.time?.trim() || "";
        return bt.localeCompare(at);
      }
      if (ad) return -1;
      if (bd) return 1;
      return b.title.localeCompare(a.title);
    });

  const hasMainGrid = mainGridItems.length > 0;
  const hasPrevious = previousItems.length > 0;
  const hasAnyEvents = hasMainGrid || hasPrevious;
  const embedSrc = getMandirCalendarEmbedSrc();
  const calendarIntroParts = mandirCalendar.embedIntro
    .split(/\n\s*\n/g)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section id="events" className="border-t border-gold/15 bg-parchment py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-10 max-w-3xl">
          <div className="flex flex-wrap items-baseline gap-3 gap-y-2">
            <h2 className="font-display text-3xl font-semibold text-deep sm:text-4xl">
              {events.sectionTitle}
            </h2>
            {!hasAnyEvents ? (
              <span className="inline-flex items-center rounded-full border border-gold/35 bg-gold/15 px-3 py-1 font-display text-xs font-semibold uppercase tracking-wide text-gold-dim">
                {events.comingSoonLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-lg text-earth">{events.intro}</p>
          <p className="mt-2 text-base text-earth/90">
            <span className="font-semibold text-deep">Wednesday Lunch Club</span>: Wednesdays, 11:00am
            – 2:00pm (just turn up).
          </p>
          {hasAnyEvents ? (
            <p className="mt-4 max-w-3xl rounded-xl border border-gold/20 bg-parchment-muted/50 px-4 py-3 text-sm leading-relaxed text-earth sm:text-base">
              {events.cardsCalendarHint}
            </p>
          ) : null}
        </header>

        {!hasAnyEvents ? (
          <p className="mb-10 max-w-3xl text-lg leading-relaxed text-earth">{events.comingSoonBody}</p>
        ) : null}

        {hasMainGrid ? (
          <ul className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mainGridItems.map((ev) => (
              <EventPosterCard key={`${ev.title}-${ev.dateLabel}`} ev={ev} ended={isEventEnded(ev)} />
            ))}
          </ul>
        ) : hasPrevious ? (
          <p className="mb-8 max-w-3xl text-base leading-relaxed text-earth">
            No upcoming highlighted events in the cards above just now — see{" "}
            <a href="#previous-events" className="font-semibold text-gold-dim underline-offset-2 hover:underline">
              previous events
            </a>{" "}
            below, or the Mandir calendar.
          </p>
        ) : null}

        {hasAnyEvents ? (
          <details
            id="previous-events"
            className="group mb-12 scroll-mt-28 overflow-hidden rounded-2xl border border-gold/25 bg-parchment-muted/30 shadow-sm open:bg-parchment-muted/45"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 outline-none transition hover:bg-white/40 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-parchment sm:px-5 sm:py-4 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 text-left">
                <span className="font-display text-lg font-semibold text-deep sm:text-xl">
                  {events.previousEventsTitle}
                </span>
                <span className="ml-2 whitespace-nowrap text-sm font-normal text-earth/80">
                  ({previousItems.length})
                </span>
                <span className="mt-0.5 block text-xs text-earth/70 sm:text-sm">
                  {events.previousEventsToggleHint}
                </span>
              </span>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-white/70 text-gold-dim shadow-sm"
                aria-hidden
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <div className="border-t border-gold/15 px-2 pb-6 pt-2 sm:px-4 sm:pt-4">
              {previousItems.length > 0 ? (
                <>
                  <p className="mb-4 max-w-3xl px-2 text-sm leading-relaxed text-earth sm:px-0 sm:text-base">
                    {events.previousEventsIntro}
                  </p>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {previousItems.map((ev) => (
                      <EventPosterCard key={`prev-${ev.dateIso ?? "nodate"}-${ev.title}`} ev={ev} ended />
                    ))}
                  </ul>
                </>
              ) : (
                <p className="max-w-3xl px-2 py-3 text-sm leading-relaxed text-earth sm:px-0 sm:text-base">
                  {events.previousEventsEmptyBody}
                </p>
              )}
            </div>
          </details>
        ) : null}

        <div className="border-t border-gold/15 pt-10">
          <h3 className="font-display text-xl font-semibold text-deep sm:text-2xl">Mandir Calendar</h3>
          <div className="mt-2 max-w-3xl space-y-3 text-base leading-relaxed text-earth sm:text-lg">
            {calendarIntroParts.map((text, idx) => (
              <p
                key={idx}
                className={
                  text.startsWith("⚠️")
                    ? "rounded-xl border border-gold/25 bg-parchment-muted/60 px-4 py-3 text-base leading-relaxed text-earth"
                    : undefined
                }
              >
                {text}
              </p>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={mandirCalendar.openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full bg-gold px-5 py-3 text-sm font-semibold text-deep shadow-sm transition hover:bg-saffron sm:w-auto sm:py-2.5"
            >
              {mandirCalendar.openLabel}
            </a>
            <a
              href={mandirCalendar.subscribeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-gold/50 bg-white/80 px-5 py-3 text-sm font-semibold text-gold-dim transition hover:border-gold hover:bg-white hover:text-deep sm:w-auto sm:py-2.5"
            >
              {mandirCalendar.subscribeGoogleLabel}
            </a>
            <a
              href={getMandirCalendarIcalUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-gold/50 bg-white/80 px-5 py-3 text-sm font-semibold text-gold-dim transition hover:border-gold hover:bg-white hover:text-deep sm:w-auto sm:py-2.5"
            >
              {mandirCalendar.icalSubscribeLabel}
            </a>
            <a
              href={getMandirCalendarWebcalUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-gold/35 bg-parchment-muted/80 px-5 py-3 text-sm font-semibold text-earth transition hover:border-gold hover:text-deep sm:w-auto sm:py-2.5"
            >
              {mandirCalendar.webcalAppleLabel}
            </a>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-gold/20 bg-white/60 shadow-sm">
            <iframe
              title={mandirCalendar.embedTitle}
              src={embedSrc}
              className="h-[min(36rem,70vh)] w-full min-h-[20rem] border-0 sm:h-[32rem] lg:h-[36rem]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
