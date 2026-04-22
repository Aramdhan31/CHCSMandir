import { connect, getGoogleMapsEmbedSrc, visit } from "@/content/site";
import { MandirMapEmbed } from "@/components/MandirMapEmbed";
import { ContactForm } from "./ContactForm";

/** Map beside services — large but slightly shorter than the Facebook-only strip. */
const visitMapHeightClass =
  "h-[min(52dvh,28rem)] sm:h-[min(58dvh,32rem)] lg:h-[min(62dvh,36rem)]";

export function VisitSection() {
  const mapSrc = getGoogleMapsEmbedSrc();
  const d = visit.directions;

  return (
    <section
      id="visit"
      className="bg-parchment py-16 sm:py-20"
      aria-labelledby="visit-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="visit-heading"
          className="font-display text-3xl font-semibold text-deep sm:text-4xl"
        >
          {visit.sectionTitle}
        </h2>
        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-stretch">
          <div className="rounded-2xl border border-gold/20 bg-white/70 p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold text-earth">
              {visit.servicesHeading}
            </h3>
            <address className="mt-4 not-italic text-earth">
              <p className="text-sm font-semibold text-deep">{visit.addressLabel}</p>
              <p className="mt-1">
                {visit.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </address>
            <p className="mt-4 text-sm">
              <span className="font-semibold text-deep">{visit.phoneLabel}</span>
              <br />
              <a href={visit.phoneHref} className="text-gold-dim hover:underline">
                {visit.phoneDisplay}
              </a>
            </p>
            <p className="mt-3 text-sm">
              <span className="font-semibold text-deep">{visit.emailLabel}</span>
              <br />
              <a
                href={`mailto:${visit.email}`}
                className="text-gold-dim hover:underline"
              >
                {visit.email}
              </a>
            </p>
          </div>

          <div className="rounded-2xl border border-gold/20 bg-white/70 p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold text-earth">
              {visit.directionsHeading}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-earth">
              {visit.directionsIntro}
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gold/15 bg-parchment/40 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-dim">
                  {d.trainsLabel}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-earth">
                  {d.trains.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-gold/15 bg-parchment/40 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-dim">
                  {d.busesLabel}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-earth">
                  {d.buses.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-gold/15 bg-parchment/40 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-dim">
                {d.drivingLabel}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-earth">{d.driving}</p>
            </div>
          </div>

          <div
            id="visit-map"
            className="flex min-h-0 flex-col rounded-2xl border border-gold/20 bg-white/80 p-4 shadow-sm sm:p-5"
          >
            <h3 className="font-display text-lg font-semibold text-deep">
              {connect.map.heading}
            </h3>
            <p className="mt-1 text-sm text-earth">
              {visit.addressLines.join(" · ")}
            </p>
            <div className={`mt-4 w-full ${visitMapHeightClass}`}>
              <MandirMapEmbed mapSrc={mapSrc} layout="fill" />
            </div>
            <p className="mt-3 text-center text-sm">
              <a
                href={connect.map.openInMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gold-dim underline-offset-4 hover:text-deep hover:underline"
              >
                {connect.map.openInMapsLabel}
              </a>
            </p>
          </div>

          <div className="rounded-2xl border border-gold/20 bg-white/70 p-6 shadow-sm lg:col-span-2">
            <h3 className="font-display text-lg font-semibold text-deep">
              {visit.contactFormHeading}
            </h3>
            <div className="mt-4">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
