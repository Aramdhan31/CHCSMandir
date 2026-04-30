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
import {
  buildGoogleCalendarTemplateUrl,
  buildIcsDownloadUrl,
} from "@/lib/events/calendarLinks";
import { EventImageLightbox } from "@/components/EventImageLightbox";

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
  const hasCards = cardItems.length > 0;
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
            {!hasCards ? (
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
          {hasCards ? (
            <p className="mt-4 max-w-3xl rounded-xl border border-gold/20 bg-parchment-muted/50 px-4 py-3 text-sm leading-relaxed text-earth sm:text-base">
              {events.cardsCalendarHint}
            </p>
          ) : null}
        </header>

        {!hasCards ? (
          <p className="mb-10 max-w-3xl text-lg leading-relaxed text-earth">{events.comingSoonBody}</p>
        ) : null}

        {hasCards ? (
          <ul className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cardItems.map((ev) => (
              <li key={`${ev.title}-${ev.dateLabel}`}>
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gold/20 bg-white/60 shadow-sm transition hover:border-gold/40 hover:shadow-md">
                  <div className="relative aspect-[3/4] w-full border-b border-gold/15 bg-parchment-muted/60">
                    {ev.imageSrc ? (
                      <EventImageLightbox
                        src={ev.imageSrc}
                        alt={ev.title}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain object-center p-3"
                        enable
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                        <div
                          className="pointer-events-none absolute inset-0 opacity-80"
                          aria-hidden
                          style={{
                            backgroundImage:
                              "radial-gradient(circle at 1px 1px, rgba(201,162,39,0.18) 1px, transparent 0)",
                            backgroundSize: "18px 18px",
                          }}
                        />
                        <div
                          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_35%,rgba(201,162,39,0.20),transparent)]"
                          aria-hidden
                        />
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/25 bg-white/70 shadow-sm">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-7 w-7 text-gold-dim"
                            fill="none"
                            aria-hidden
                          >
                            <path
                              d="M7 4v2M17 4v2M6 9h12M6.5 6h11A1.5 1.5 0 0 1 19 7.5v11A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-11A1.5 1.5 0 0 1 6.5 6Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <p className="relative font-display text-lg font-semibold text-deep">
                          Poster coming soon
                        </p>
                        <p className="relative text-sm font-semibold text-earth/80">{ev.title}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex h-full flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-sm font-semibold text-gold-dim">
                      {ev.dateLabel}
                    </p>
                    {isEventEnded(ev) ? (
                      <span className="inline-flex items-center rounded-full border border-red-900/15 bg-red-50 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-red-950">
                        Event ended
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-deep">
                    {ev.title}
                  </h3>
                  {ev.summary ? (
                    <p className="mt-1 text-sm text-earth/80">{ev.summary}</p>
                  ) : null}
                  {!isEventEnded(ev) && ev.dateIso ? (
                    <div className="mt-auto space-y-2 border-t border-gold/10 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gold-dim/90">
                        Save to your calendar
                      </p>
                      {(() => {
                        const googleCalUrl = buildGoogleCalendarTemplateUrl({
                          title: ev.title,
                          dateIso: ev.dateIso,
                          time: ev.time ?? null,
                          details: ev.summary,
                        });
                        const icsUrl = buildIcsDownloadUrl({
                          title: ev.title,
                          dateIso: ev.dateIso,
                          time: ev.time,
                          summary: ev.summary,
                        });
                        return (
                          <div className="flex flex-col gap-2">
                            {googleCalUrl ? (
                              <a
                                href={googleCalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-full bg-deep px-4 py-2.5 text-center text-sm font-semibold text-parchment shadow-sm ring-1 ring-parchment/15 transition hover:bg-deep/90 hover:ring-gold/40"
                              >
                                Add to Google Calendar
                              </a>
                            ) : null}
                            {icsUrl ? (
                              <a
                                href={icsUrl}
                                className="text-center text-sm font-semibold text-gold-dim underline-offset-4 hover:text-deep hover:underline"
                              >
                                Apple / Outlook (.ics download)
                              </a>
                            ) : null}
                          </div>
                        );
                      })()}
                      {ev.href && !ev.href.startsWith("/events/ics") && ev.cta ? (
                        <a
                          href={ev.href}
                          target={ev.href.startsWith("http") ? "_blank" : undefined}
                          rel={ev.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="inline-flex text-sm font-semibold text-gold-dim underline-offset-4 hover:text-deep hover:underline"
                        >
                          {ev.cta}
                        </a>
                      ) : null}
                    </div>
                  ) : !isEventEnded(ev) && ev.href && ev.cta ? (
                    <div className="mt-auto pt-4">
                      <a
                        href={ev.href}
                        target={ev.href.startsWith("http") ? "_blank" : undefined}
                        rel={ev.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="inline-flex text-sm font-semibold text-gold-dim underline-offset-4 hover:text-deep hover:underline"
                      >
                        {ev.cta}
                      </a>
                    </div>
                  ) : null}
                  </div>
                </article>
              </li>
            ))}
          </ul>
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
