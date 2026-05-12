import { FacebookPageHalfEmbed } from "@/components/FacebookPageHalfEmbed";
import { connect, footer } from "@/content/site";

function FacebookCtaButton({ className }: { className?: string }) {
  const fbUrl = footer.facebookUrl;
  return (
    <a
      href={fbUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex min-h-[3rem] w-full items-center justify-center gap-2.5 rounded-full bg-gold px-5 text-sm font-semibold text-deep shadow-md transition hover:bg-saffron focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-muted"
      }
    >
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#1877F2"
          d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        />
      </svg>
      {connect.facebook.ctaButton}
    </a>
  );
}

/**
 * Large screens: one card, **two equal columns** — copy + button (left), Facebook Page Plugin (right).
 * Small screens: button block first, then copy (no embed — Meta’s plugin is unreliable on many phones).
 */
export function ConnectSection() {
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
          {/* Narrow viewports: CTA first, then story (matches earlier mobile UX). */}
          <div className="lg:hidden">
            <div className="flex flex-col justify-center gap-3 bg-parchment-muted/40 px-4 py-5 sm:gap-4 sm:px-6 sm:py-8">
              <p className="text-xs leading-snug text-earth/90 sm:text-sm sm:leading-relaxed">
                For the full timeline on Facebook (every post and photo), use the button below.
              </p>
              <FacebookCtaButton />
              <p className="text-center text-[0.7rem] text-earth/75 sm:text-left sm:text-xs">
                {footer.facebookLabel} · opens in a new tab
              </p>
            </div>
            <div className="space-y-3 border-t border-gold/15 p-4 sm:p-6">
              <p className="text-sm leading-relaxed text-earth sm:text-base sm:leading-relaxed">
                {connect.intro}
              </p>
              <h3 className="font-display text-base font-semibold text-deep sm:text-lg">
                {connect.facebook.heading}
              </h3>
            </div>
          </div>

          {/* Laptop / desktop: half story + actions | half live embed */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:items-stretch">
            <div className="flex flex-col justify-center gap-4 border-r border-gold/15 bg-white/80 px-8 py-8 xl:px-10 xl:py-10">
              <p className="text-lg leading-relaxed text-earth">{connect.intro}</p>
              <h3 className="font-display text-xl font-semibold text-deep">{connect.facebook.heading}</h3>
              <p className="text-sm leading-relaxed text-earth/90">{connect.facebook.ctaBody}</p>
              <FacebookCtaButton />
              <p className="text-xs text-earth/75">{footer.facebookLabel} · opens in a new tab</p>
            </div>
            <div className="flex flex-col justify-center bg-parchment-muted/30 px-6 py-8 xl:px-8 xl:py-10">
              <FacebookPageHalfEmbed />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
