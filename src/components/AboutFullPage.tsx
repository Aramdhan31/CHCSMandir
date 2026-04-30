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
  const galleryPhotos = [...about.pageGallery.photos];
  const primary = galleryPhotos[0];
  const primaryHasSrc = primary && "src" in primary;
  const secondary = galleryPhotos[1];
  const tertiary = galleryPhotos[2];
  const hasTertiaryImage = Boolean(tertiary && "src" in tertiary);
  const mainHallStack =
    secondary && "mainHallStack" in secondary ? secondary.mainHallStack : null;
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

          <div className="mt-10 grid gap-5 md:grid-cols-12 md:items-start md:gap-6">
            <div className="flex flex-col overflow-hidden rounded-2xl border border-gold/25 bg-white/60 shadow-md md:col-span-6 md:justify-self-stretch">
              {primaryHasSrc ? (
                <figure className="relative m-0 min-w-0 w-full overflow-hidden">
                  <div
                    className={`relative w-full overflow-hidden ${hasTertiaryImage ? "border-b border-gold/20" : ""} ${
                      "frameClass" in primary && primary.frameClass ? primary.frameClass : "aspect-[16/10]"
                    }`}
                  >
                    <Image
                      src={primary.src}
                      alt={primary.alt}
                      fill
                      className={
                        "imageClass" in primary && primary.imageClass
                          ? primary.imageClass
                          : "object-cover object-center"
                      }
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <figcaption
                    className="relative z-[1] border-t border-gold/20 bg-parchment px-4 py-3.5 text-left text-base font-semibold leading-snug text-deep shadow-[inset_0_1px_0_rgba(201,162,39,0.12)] md:pointer-events-none md:absolute md:inset-x-0 md:bottom-0 md:border-0 md:bg-gradient-to-t md:from-deep md:from-40% md:via-deep/75 md:to-transparent md:px-4 md:py-0 md:pb-4 md:pt-16 md:text-sm md:font-semibold md:text-parchment md:shadow-none"
                  >
                    {primary.caption}
                  </figcaption>
                </figure>
              ) : null}

              {tertiary && "src" in tertiary ? (
                <>
                  <figure className="relative m-0 w-full overflow-hidden">
                    <div
                      className={`relative w-full overflow-hidden ${
                        "frameClass" in tertiary && tertiary.frameClass ? tertiary.frameClass : "aspect-[16/11]"
                      }`}
                    >
                      <Image
                        src={tertiary.src}
                        alt={tertiary.alt}
                        fill
                        unoptimized={tertiary.src.toLowerCase().endsWith(".heic")}
                        className={
                          "imageClass" in tertiary && tertiary.imageClass
                            ? tertiary.imageClass
                            : "object-cover object-center"
                        }
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    <figcaption
                      className="relative z-[1] flex flex-col gap-1 border-t border-gold/20 bg-parchment px-4 py-3.5 text-left text-sm font-semibold leading-snug text-deep md:pointer-events-none md:absolute md:inset-x-0 md:bottom-0 md:border-0 md:bg-gradient-to-t md:from-deep md:from-40% md:via-deep/75 md:to-transparent md:px-4 md:py-0 md:pb-4 md:pt-16 md:text-sm md:text-parchment"
                    >
                      <span>{tertiary.caption}</span>
                      {"captionSub" in tertiary && tertiary.captionSub ? (
                        <span className="text-xs font-normal leading-snug text-earth/80 md:text-[0.7rem] md:text-parchment/80">
                          {tertiary.captionSub}
                        </span>
                      ) : null}
                    </figcaption>
                  </figure>
                  {"murtisNote" in tertiary && tertiary.murtisNote ? (
                    <p className="border-t border-gold/15 px-3 py-3 text-xs leading-relaxed text-earth/85 md:text-sm md:leading-relaxed">
                      {tertiary.murtisNote}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>

            {mainHallStack ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-gold/20 bg-white/60 p-2 shadow-sm md:col-span-6 md:h-full">
                <figure className="relative m-0 aspect-[16/11] overflow-hidden rounded-xl border border-gold/15">
                  <Image
                    src={mainHallStack.hero.src}
                    alt={mainHallStack.hero.alt}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-deep/85 to-transparent px-3 pb-3 pt-10 text-left text-xs font-semibold text-parchment sm:text-sm">
                    {mainHallStack.caption}
                  </figcaption>
                </figure>
                <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  <figure className="relative m-0 aspect-[4/5] overflow-hidden rounded-xl border border-gold/15">
                    <Image
                      src={mainHallStack.bottomLeft.src}
                      alt={mainHallStack.bottomLeft.alt}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </figure>
                  <figure className="relative m-0 aspect-[4/5] overflow-hidden rounded-xl border border-gold/15">
                    <Image
                      src={mainHallStack.bottomRight.src}
                      alt={mainHallStack.bottomRight.alt}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </figure>
                </div>
                <p className="mx-2 mb-2 text-xs text-earth/85 md:text-sm">
                  These three photos are all from the <strong className="text-deep">main hall</strong>: the wide view shows the central shrine with{" "}
                  <strong className="text-deep">Rama, Sita and Lakshmana</strong> (with <strong className="text-deep">Hanuman</strong> at their feet),
                  flanked by <strong className="text-deep">Om</strong> on the altar; the left panel is <strong className="text-deep">Radha–Krishna</strong>;
                  the right panel is <strong className="text-deep">Shiva–Parvati</strong> (with <strong className="text-deep">Nandi</strong>).
                </p>
              </div>
            ) : null}
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
