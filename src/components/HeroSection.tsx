import Image from "next/image";
import { Noto_Serif_Devanagari } from "next/font/google";
import { hero, site } from "@/content/site";

const omDisplay = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["600"],
  display: "swap",
});

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-deep bg-grain text-parchment"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(184,134,11,0.35),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-14 sm:px-6 sm:pt-10 sm:pb-20 lg:pt-12 lg:pb-24">
        <p
          className={`${omDisplay.className} mx-auto mb-6 mt-2 max-w-full select-none text-center text-7xl leading-none tracking-tight text-gold [text-shadow:0_0_48px_rgba(212,160,23,0.4),0_4px_24px_rgba(0,0,0,0.35)] sm:mb-8 sm:mt-3 sm:text-8xl sm:leading-none md:text-[7.25rem] md:leading-[0.95] lg:mb-10 lg:text-[8.25rem] lg:leading-[0.92] xl:text-[9.25rem]`}
          role="img"
          aria-label="Om"
        >
          ॐ
        </p>
        <div className="grid items-start gap-8 sm:gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
          <div className="max-w-2xl text-left lg:max-w-3xl">
            <div className="min-w-0 max-w-full text-left">
              <p className="mb-3 font-display text-sm font-medium uppercase tracking-[0.2em] text-gold">
                {hero.eyebrow}
              </p>
              <h1 className="w-fit max-w-full font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                {hero.title}
              </h1>
            </div>
            <p className="mt-4 max-w-2xl text-lg text-parchment-muted sm:text-xl">
              {site.tagline}
            </p>
            <blockquote className="mt-10 max-w-2xl border-l-4 border-gold pl-6">
              <p className="font-display text-xl italic text-parchment sm:text-2xl">
                &ldquo;{hero.quote}&rdquo;
              </p>
              <cite className="mt-3 block text-sm not-italic text-gold/90">
                {hero.quoteCitation}
              </cite>
            </blockquote>
            <a
              href={hero.primaryCtaHash}
              className="mt-10 inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-deep shadow-lg transition hover:bg-saffron"
            >
              {hero.primaryCtaLabel}
            </a>
          </div>

          <div className="relative mx-auto w-full max-w-[17.5rem] sm:max-w-md lg:mx-0 lg:max-w-none lg:justify-self-end">
            <div
              className="relative w-full overflow-hidden rounded-2xl border border-gold/30 bg-deep shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)] ring-1 ring-parchment/10
                h-[min(46dvh,22rem)] sm:h-[min(48dvh,24rem)]
                lg:aspect-[4/5] lg:h-auto lg:max-h-[min(32rem,52vh)] lg:max-w-md lg:min-h-0 xl:max-h-[min(36rem,54vh)] xl:max-w-lg"
            >
              <Image
                src={hero.homeImageSrc}
                alt={hero.homeImageAlt}
                fill
                priority
                sizes="(max-width: 1023px) min(100vw, 28rem), (max-width: 1280px) 36vw, 448px"
                className="object-cover object-center"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep/20 via-transparent to-deep/10"
                aria-hidden
              />
            </div>
          </div>
        </div>

        <div
          id={hero.templeGalleryId}
          className="mt-16 border-t border-gold/20 pt-14 sm:mt-20 sm:pt-16 lg:mt-24 lg:pt-20"
        >
          <h2 className="font-display text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
            <span className="text-gold">{hero.templeGalleryTitle}</span>
          </h2>
          <p className="mt-2 max-w-2xl text-parchment-muted">
            {hero.templeGalleryIntro}
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-6 lg:gap-8">
            {hero.homeImages.map((photo, index) => {
              const frameClass =
                "galleryFrameClass" in photo &&
                typeof photo.galleryFrameClass === "string"
                  ? photo.galleryFrameClass
                  : "aspect-[4/5]";
              const imageClass =
                "galleryImageClass" in photo &&
                typeof photo.galleryImageClass === "string"
                  ? photo.galleryImageClass
                  : "object-cover object-center";
              const letterbox = imageClass.includes("contain");
              return (
              <figure key={photo.src} className="m-0">
                <div
                  className={`relative overflow-hidden rounded-2xl border border-gold/30 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)] ring-1 ring-parchment/10 ${frameClass} ${letterbox ? "bg-deep/40" : ""}`}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                    className={imageClass}
                  />
                  {!letterbox ? (
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep/45 via-transparent to-deep/15"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <figcaption className="mt-2 text-center text-xs font-medium text-gold/85 sm:text-sm">
                  {photo.label}
                </figcaption>
              </figure>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
