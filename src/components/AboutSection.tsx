import Image from "next/image";
import Link from "next/link";
import { about, aboutPageMeta } from "@/content/site";

const ABOUT_IMAGE_WIDTH = 1600;
const ABOUT_IMAGE_HEIGHT = 1067;

export function AboutSection() {
  return (
    <section id="about" className="bg-parchment-muted/50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/*
          Heading on its own row; image shares a row with prose only (aligns with first paragraph).
          No client-side measurement — avoids resize/hydration “spazzing”.
        */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:mt-10 lg:grid-cols-[minmax(0,65ch)_minmax(0,32rem)] lg:items-start lg:gap-x-10 lg:gap-y-6 xl:gap-x-12">
          <h2 className="col-span-full font-display text-3xl font-semibold text-deep sm:text-4xl">
            {about.sectionTitle}
          </h2>

          <div className="mx-auto w-full max-w-prose space-y-4 text-lg leading-relaxed text-earth lg:mx-0 lg:max-w-none">
            {about.homeSummaryParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className="pt-2">
              <Link
                href={aboutPageMeta.path}
                className="inline-flex items-center justify-center rounded-full border-2 border-gold/40 bg-white/80 px-6 py-3 text-sm font-semibold text-gold-dim shadow-sm transition hover:border-gold hover:bg-white hover:text-deep"
              >
                {about.readMoreCta}
              </Link>
            </p>
          </div>

          <figure className="mx-auto w-full max-w-xl min-w-0 shrink-0 justify-self-start lg:mx-0 lg:max-w-none">
            <Image
              src={about.homeImage.src}
              alt={about.homeImage.alt}
              width={ABOUT_IMAGE_WIDTH}
              height={ABOUT_IMAGE_HEIGHT}
              className="h-auto w-full max-w-xl object-contain object-top lg:max-w-full"
              sizes="(max-width: 1023px) 90vw, (max-width: 1280px) 40vw, 512px"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
