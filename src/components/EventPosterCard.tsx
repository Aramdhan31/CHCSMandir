import type { SiteEventItem } from "@/content/site";
import { buildIcsDownloadUrl } from "@/lib/events/calendarLinks";
import { EventImageLightbox } from "@/components/EventImageLightbox";

/** One home-page event poster — same layout for upcoming grid and previous-events panel. */
export function EventPosterCard({ ev, ended = false }: { ev: SiteEventItem; ended?: boolean }) {
  return (
    <li>
      <article
        className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-white/60 shadow-sm transition ${
          ended
            ? "border-earth/25 opacity-[0.97]"
            : "border-gold/20 hover:border-gold/40 hover:shadow-md"
        }`}
        aria-label={ended ? `${ev.title} — event ended` : undefined}
      >
        <div className="relative aspect-[3/4] w-full border-b border-gold/15 bg-parchment-muted/60">
          {ev.imageSrc ? (
            <EventImageLightbox
              src={ev.imageSrc}
              alt={ev.title}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain object-center p-3"
              enable={!ended}
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
              <p className="relative font-display text-lg font-semibold text-deep">Poster coming soon</p>
              <p className="relative text-sm font-semibold text-earth/80">{ev.title}</p>
            </div>
          )}
        </div>
        <div className="flex h-full flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-sm font-semibold text-gold-dim">{ev.dateLabel}</p>
            {ended ? (
              <span className="inline-flex items-center rounded-full border border-red-900/15 bg-red-50 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-red-950">
                Event ended
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 font-display text-lg font-semibold text-deep">{ev.title}</h3>
          {ev.summary ? <p className="mt-1 text-sm text-earth/80">{ev.summary}</p> : null}
          {!ended && ev.dateIso ? (
            <div className="mt-auto space-y-2 border-t border-gold/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-dim/90">
                Save to your calendar
              </p>
              {(() => {
                const icsUrl = buildIcsDownloadUrl({
                  title: ev.title,
                  dateIso: ev.dateIso,
                  time: ev.time,
                  summary: ev.summary,
                });
                return icsUrl ? (
                  <a
                    href={icsUrl}
                    className="inline-flex items-center justify-center rounded-full bg-deep px-4 py-2.5 text-center text-sm font-semibold text-parchment shadow-sm ring-1 ring-parchment/15 transition hover:bg-deep/90 hover:ring-gold/40"
                  >
                    Add to calendar
                  </a>
                ) : null;
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
          ) : !ended && ev.href && ev.cta ? (
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
  );
}
