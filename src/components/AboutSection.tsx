"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { about, aboutPageMeta } from "@/content/site";

const ABOUT_IMAGE_WIDTH = 1600;
const ABOUT_IMAGE_HEIGHT = 1067;

const LG = "(min-width: 1024px)";
const XL = "(min-width: 1280px)";
/** Max photo width (px) beside prose — keeps the image from feeling oversized on laptop / wide layouts. */
const ABOUT_IMAGE_WIDTH_CAP_LG = 520;
const ABOUT_IMAGE_WIDTH_CAP_XL = 720;

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);

  return matches;
}

type TextBox = { width: number; height: number };

export function AboutSection() {
  const textRef = useRef<HTMLDivElement>(null);
  const [textBox, setTextBox] = useState<TextBox>({ width: 0, height: 0 });
  const isLg = useMediaQuery(LG);
  const isXl = useMediaQuery(XL);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      setTextBox({
        width: Math.round(r.width),
        height: Math.round(r.height),
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const desktopReady = isLg && textBox.width > 0 && textBox.height > 0;
  const imageWidthCap = isXl ? ABOUT_IMAGE_WIDTH_CAP_XL : ABOUT_IMAGE_WIDTH_CAP_LG;
  const desktopImageWidth = desktopReady
    ? Math.min(Math.max(textBox.width, 420), imageWidthCap)
    : 1;
  const desktopImageHeight = desktopReady
    ? Math.min(textBox.height, Math.round(desktopImageWidth * 0.62))
    : 1;

  return (
    <section
      id="about"
      className="bg-parchment-muted/50 py-16 sm:py-20"
      suppressHydrationWarning
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-deep sm:text-4xl">
          {about.sectionTitle}
        </h2>

        <div className="mt-8 flex flex-col gap-8 lg:mt-10 lg:flex-row lg:items-start lg:gap-10 xl:gap-12">
          {/*
            No flex-1 here — otherwise the block stretches to half the row and the photo no longer
            matches the real width of the paragraphs (max-w-prose).
          */}
          <div
            ref={textRef}
            className="mx-auto w-full max-w-prose space-y-4 text-lg leading-relaxed text-earth lg:mx-0 lg:flex-none lg:max-w-prose"
          >
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

          {!isLg ? (
            <figure className="mx-auto w-full max-w-xl shrink-0">
              <Image
                src={about.homeImage.src}
                alt={about.homeImage.alt}
                width={ABOUT_IMAGE_WIDTH}
                height={ABOUT_IMAGE_HEIGHT}
                className="h-auto w-full"
                sizes="100vw"
              />
            </figure>
          ) : (
            <figure
              className="relative mx-0 hidden shrink-0 lg:block lg:-mt-12"
              style={{
                width: desktopImageWidth,
                height: desktopImageHeight,
              }}
            >
              {desktopReady ? (
                <div className="relative h-full w-full overflow-hidden rounded-2xl border border-gold/25 bg-deep/15 shadow-sm ring-1 ring-gold/10">
                  <Image
                    src={about.homeImage.src}
                    alt={about.homeImage.alt}
                    fill
                    className="object-cover object-[50%_42%]"
                    sizes={`${desktopImageWidth}px`}
                  />
                </div>
              ) : null}
            </figure>
          )}
        </div>
      </div>
    </section>
  );
}
