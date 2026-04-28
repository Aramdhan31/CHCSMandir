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
      {/* Warm lift at top centre (reference hero) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_75%_at_50%_-5%,rgba(72,52,42,0.55)_0%,transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-18%,rgba(184,134,11,0.32),transparent_52%)]"
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
        <div className="grid items-start gap-8 sm:gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="max-w-2xl text-left lg:max-w-3xl">
            <div className="min-w-0 max-w-full text-left">
              <p className="mb-3 font-display text-sm font-medium uppercase tracking-[0.2em] text-gold">
                {hero.eyebrow}
              </p>
              <h1 className="w-fit max-w-full font-display text-3xl font-bold leading-[1.12] tracking-tight sm:text-4xl md:text-5xl">
                <span className="block">{hero.titleLines[0]}</span>
                <span className="block">{hero.titleLines[1]}</span>
              </h1>
            </div>
            <p className="mt-4 max-w-2xl text-lg text-parchment sm:text-xl sm:leading-relaxed">
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

          <div className="relative mx-auto hidden w-full max-w-[22rem] sm:block sm:max-w-md lg:mx-0 lg:max-w-none lg:justify-self-end">
            <div
              className="relative aspect-[4/3] w-full max-w-[22rem] overflow-hidden rounded-2xl border border-gold/30 bg-deep shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)] ring-1 ring-parchment/10 sm:max-w-md lg:max-w-[30rem] xl:max-w-[32rem]"
            >
              <Image
                src={hero.homeImageSrc}
                alt={hero.homeImageAlt}
                fill
                priority
                quality={92}
                sizes="(max-width: 1023px) 320px, (max-width: 1280px) 384px, 416px"
                className={
                  hero.homeImageSrc === "/mandir-exterior.jpg"
                    ? "object-cover object-[50%_86%]"
                    : "object-cover object-center"
                }
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep/10 via-transparent to-transparent"
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
                  : "aspect-[16/10] sm:aspect-[4/5] lg:aspect-[4/3]";
              const imageClass =
                "galleryImageClass" in photo &&
                typeof photo.galleryImageClass === "string"
                  ? photo.galleryImageClass
                  : "object-cover object-center";
              const letterbox = imageClass.includes("contain");
              return (
              <figure key={photo.src} className="m-0">
                <div
                  className={`relative max-h-[52vh] lg:max-h-[22rem] xl:max-h-[24rem] overflow-hidden rounded-2xl border border-gold/30 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)] ring-1 ring-parchment/10 ${frameClass} ${letterbox ? "bg-deep/40" : ""}`}
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
