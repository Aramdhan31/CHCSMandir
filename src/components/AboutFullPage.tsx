import Image from "next/image";
import Link from "next/link";
import { about, aboutPageMeta } from "@/content/site";

function PageOrnament({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-gold/60 ${className ?? ""}`}
      aria-hidden
    >
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/70 sm:w-20" />
      <svg className="h-8 w-8 shrink-0" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="0.75" />
        <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="0.75" />
        <path d="M16 1v6M16 25v6M1 16h6M25 16h6" stroke="currentColor" strokeWidth="0.75" />
      </svg>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/70 sm:w-20" />
    </div>
  );
}

export function AboutFullPage() {
  const galleryPhotos = about.pageGallery.photos;
  return (
    <div className="bg-parchment text-ink">
      <header className="relative overflow-hidden bg-deep bg-grain text-parchment">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-30%,rgba(201,162,39,0.28),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <nav
            className="mb-10 flex justify-center text-sm text-parchment-muted"
            aria-label="Breadcrumb"
          >
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href="/"
                  className="font-medium text-gold transition hover:text-parchment"
                >
                  {aboutPageMeta.breadcrumbHome}
                </Link>
              </li>
              <li aria-hidden className="text-parchment-muted/60">
                /
              </li>
              <li className="font-medium text-parchment">{about.sectionTitle}</li>
            </ol>
          </nav>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.4em] text-gold">
            {aboutPageMeta.heroEyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {about.sectionTitle}
          </h1>
          <PageOrnament className="mt-8" />
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-parchment-muted">
            {about.pageIntro}
          </p>
        </div>
      </header>

      <section
        className="border-t border-gold/20 bg-parchment-muted/50 py-14 sm:py-16"
        aria-labelledby="about-mandir-photos"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2
            id="about-mandir-photos"
            className="font-display text-2xl font-semibold text-deep sm:text-3xl"
          >
            {about.pageGallery.title}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-earth sm:text-lg">
            {about.pageGallery.intro}
          </p>

          <div className="mt-10 flex flex-col gap-5 md:grid md:grid-cols-12 md:grid-rows-2 md:gap-4">
            {galleryPhotos.length > 0 ? (
              <figure
                className={`relative m-0 w-full min-w-0 max-w-xl overflow-hidden rounded-2xl border border-gold/25 shadow-md sm:max-w-2xl md:col-span-8 md:row-span-2 md:max-w-none ${
                  "frameClass" in galleryPhotos[0] && galleryPhotos[0].frameClass
                    ? `${galleryPhotos[0].frameClass} bg-white/60`
                    : "aspect-[16/10] bg-white/60 md:aspect-auto"
                } mx-auto md:mx-0`}
              >
                <Image
                  src={galleryPhotos[0].src}
                  alt={galleryPhotos[0].alt}
                  fill
                  className={
                    "imageClass" in galleryPhotos[0] && galleryPhotos[0].imageClass
                      ? galleryPhotos[0].imageClass
                      : "object-cover object-center"
                  }
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-deep/90 via-deep/40 to-transparent px-4 pb-4 pt-12 text-left text-sm font-semibold text-parchment">
                  {galleryPhotos[0].caption}
                </figcaption>
              </figure>
            ) : null}

            {galleryPhotos.slice(1).map((p, idx) => {
              const isOnlySide = galleryPhotos.length === 2;
              const sideClass = isOnlySide
                ? "md:col-span-4 md:col-start-9 md:row-span-2 md:aspect-auto md:min-h-[26rem]"
                : idx === 0
                  ? "md:col-span-4 md:col-start-9 md:row-start-1 md:aspect-auto md:min-h-[12.5rem]"
                  : "md:col-span-4 md:col-start-9 md:row-start-2 md:aspect-auto md:min-h-[12.5rem]";
              const imageClass =
                "imageClass" in p && p.imageClass ? p.imageClass : "object-cover object-center";
              return (
                <figure
                  key={p.src}
                  className={`relative m-0 aspect-[4/3] overflow-hidden rounded-2xl border border-gold/20 bg-white/60 shadow-sm ${sideClass}`}
                >
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    className={imageClass}
                    sizes="(max-width: 768px) 100vw, 34vw"
                  />
                  <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-deep/85 to-transparent px-3 pb-3 pt-10 text-left text-xs font-semibold text-parchment sm:text-sm">
                    {p.caption}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="space-y-14">
          {about.blocks.map((block) => (
            <article key={block.heading}>
              <h2 className="font-display text-2xl font-semibold text-deep sm:text-3xl">
                {block.heading}
              </h2>
              <PageOrnament className="mt-5" />
              <div className="mt-6 space-y-4 text-lg leading-relaxed text-earth">
                {block.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-16 text-center">
          <Link
            href="/#about"
            className="inline-flex text-sm font-semibold text-gold-dim underline-offset-4 hover:text-deep hover:underline"
          >
            ← Back to home
          </Link>
        </p>
      </section>
    </div>
  );
}
