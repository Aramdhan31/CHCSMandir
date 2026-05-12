import { connect, footer } from "@/content/site";

/**
 * We do not embed Meta’s Page Plugin timeline here: it is not the full Facebook page,
 * shows a limited slice of posts, and is known to repeat the same items when scrolling.
 * Visitors get the real feed by opening the page on Facebook.
 */
export function ConnectSection() {
  const fbUrl = footer.facebookUrl;

  return (
    <section
      id="connect"
      className="border-t border-gold/15 bg-parchment-muted/40 py-12 sm:py-16 md:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-deep sm:text-4xl">
          {connect.sectionTitle}
        </h2>

        <div className="mt-6 rounded-2xl border border-gold/20 bg-white/80 shadow-sm sm:mt-8">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:items-stretch">
            <div className="space-y-4 border-b border-gold/15 p-5 sm:p-6 lg:border-b-0 lg:border-r lg:py-8 lg:pl-8 lg:pr-10">
              <p className="text-base leading-relaxed text-earth sm:text-lg">{connect.intro}</p>
              <h3 className="font-display text-lg font-semibold text-deep sm:text-xl">
                {connect.facebook.heading}
              </h3>
            </div>

            <div className="flex flex-col justify-center gap-4 bg-parchment-muted/30 px-5 py-8 sm:px-8">
              <p className="text-sm leading-relaxed text-earth/90">{connect.facebook.ctaBody}</p>
              <a
                href={fbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-full bg-gold px-6 text-sm font-semibold text-deep shadow-sm transition hover:bg-saffron focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-muted"
              >
                {connect.facebook.ctaButton}
              </a>
              <p className="text-center text-xs text-earth/70 sm:text-left">
                {footer.facebookLabel} · opens in a new tab
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
