import { connect, footer, getFacebookPluginSrc } from "@/content/site";

/** Meta max width 500px; tall viewport so the timeline scrolls vertically inside the iframe. */
const facebookFrameClass =
  "relative mx-auto mt-4 w-full max-w-[500px] overflow-hidden rounded-xl border border-gold/20 bg-parchment-muted/50 shadow-sm h-[min(88dvh,56rem)] sm:h-[min(90dvh,60rem)]";

export function ConnectSection() {
  const fbSrc = getFacebookPluginSrc();

  return (
    <section
      id="connect"
      className="border-t border-gold/15 bg-parchment-muted/40 py-12 sm:py-16 md:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-10 max-w-3xl">
          <h2 className="font-display text-3xl font-semibold text-deep sm:text-4xl">
            {connect.sectionTitle}
          </h2>
          <p className="mt-4 text-lg text-earth">{connect.intro}</p>
        </header>

        <div className="rounded-2xl border border-gold/20 bg-white/80 p-4 shadow-sm sm:p-5 md:p-6">
          <h3 className="font-display text-lg font-semibold text-deep sm:text-xl">
            {connect.facebook.heading}
          </h3>
          <div className={facebookFrameClass}>
            <iframe
              title="Caribbean Hindu Cultural Society on Facebook — timeline"
              src={fbSrc}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
          </div>
          <p className="mt-4 text-center text-sm text-earth/90">
            <a
              href={footer.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gold-dim underline-offset-4 hover:text-deep hover:underline"
            >
              {footer.facebookLabel} — open full page for photos, videos, and full history
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
