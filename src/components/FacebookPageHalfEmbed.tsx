"use client";

import { useEffect, useRef, useState } from "react";
import { getFacebookPagePluginSrc } from "@/content/site";

/**
 * Fills the right-hand half of the Connect section card on large screens.
 * Iframe width tracks the column so Meta’s plugin stays sharp without overflowing.
 */
export function FacebookPageHalfEmbed() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [{ w, h }, setDims] = useState({ w: 420, h: 520 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const cw = Math.floor(el.clientWidth);
      const width = Math.min(500, Math.max(260, cw));
      const height = Math.min(680, Math.round(width * 1.28));
      setDims({ w: width, h: height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const src = getFacebookPagePluginSrc({ width: w, height: h });

  return (
    <div
      ref={wrapRef}
      className="relative flex w-full min-h-[min(22rem,45vh)] flex-1 flex-col justify-center overflow-hidden rounded-xl border border-earth/15 bg-white shadow-inner lg:min-h-[26rem]"
    >
      <iframe
        title="CHCS London on Facebook"
        src={src}
        width={w}
        height={h}
        className="mx-auto block max-w-full border-0"
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      />
    </div>
  );
}
