"use client";

import { useState } from "react";
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
  /** Once the visitor enables the map, keep it on — toggling off used to make the view feel like it "snaps back" */
  const [unlocked, setUnlocked] = useState(false);
  const cta = connect.map.mapOverlayCta;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-gold/15 bg-parchment-muted/50 ${sizeClass}`}
    >
      <iframe
        title="Map: Caribbean Hindu Cultural Society, 16 Ostade Road, London"
        src={mapSrc}
        className="h-full min-h-[inherit] w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        style={{ pointerEvents: unlocked ? "auto" : "none" }}
      />

      {!unlocked ? (
        <button
          type="button"
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-deep/30 px-4 text-center text-parchment outline-none transition hover:bg-deep/40 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
          onClick={() => setUnlocked(true)}
          aria-label={cta}
        >
          <span className="max-w-sm rounded-lg border border-gold/50 bg-parchment/95 px-4 py-2.5 text-sm font-semibold text-deep shadow-md">
            {cta}
          </span>
        </button>
      ) : null}
    </div>
  );
}
