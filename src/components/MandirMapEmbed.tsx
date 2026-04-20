"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { connect } from "@/content/site";

type MandirMapEmbedProps = {
  mapSrc: string;
  /** `fill` = parent supplies height (e.g. connect section); no default min-heights. */
  layout?: "default" | "fill";
};

export function MandirMapEmbed({ mapSrc, layout = "default" }: MandirMapEmbedProps) {
  const sizeClass =
    layout === "fill"
      ? "h-full min-h-0"
      : "min-h-[280px] sm:min-h-[320px] lg:min-h-[420px]";
  const [active, setActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { map: copy } = connect;

  const deactivate = useCallback(() => {
    setActive(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") deactivate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, deactivate]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl border border-gold/15 bg-parchment-muted/50 ${sizeClass}`}
    >
      <iframe
        title="Map: Caribbean Hindu Cultural Society, 16 Ostade Road, London"
        src={mapSrc}
        className="h-full min-h-[inherit] w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        style={{ pointerEvents: active ? "auto" : "none" }}
      />

      {!active ? (
        <button
          type="button"
          className="group absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 bg-gradient-to-b from-deep/55 to-deep/70 p-6 text-center text-parchment transition hover:from-deep/60 hover:to-deep/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
          onClick={() => setActive(true)}
          aria-label={`${copy.overlayTitle}: ${copy.overlayHint}`}
        >
          <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {copy.overlayTitle}
          </span>
          <span className="max-w-xs rounded-full border border-gold/50 bg-parchment/95 px-5 py-2.5 text-sm font-semibold text-deep shadow-md transition group-hover:border-gold group-hover:shadow-lg">
            {copy.overlayHint}
          </span>
          <span className="max-w-sm text-xs leading-relaxed text-parchment-muted sm:text-sm">
            {copy.overlayBody}
          </span>
        </button>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3">
          <button
            type="button"
            onClick={deactivate}
            className="pointer-events-auto rounded-full border-2 border-gold/80 bg-deep px-5 py-2.5 font-display text-sm font-semibold text-parchment shadow-lg backdrop-blur-sm transition hover:border-gold hover:bg-earth"
          >
            {copy.doneLabel}
          </button>
        </div>
      )}
    </div>
  );
}
