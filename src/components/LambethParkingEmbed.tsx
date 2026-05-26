"use client";

import { useState } from "react";
import { getLambethParkingMapUrl, visit } from "@/content/site";

const embedHeightClass = "h-[min(52dvh,26rem)] sm:h-[min(58dvh,30rem)]";

export function LambethParkingEmbed() {
  const p = visit.directions.parkingMap;
  const [unlocked, setUnlocked] = useState(false);
  const mapUrl = getLambethParkingMapUrl();

  return (
    <div
      id="visit-parking-map"
      className="mt-6 rounded-2xl border border-gold/20 bg-white/80 p-4 shadow-sm sm:p-5"
    >
      <h3 className="font-display text-lg font-semibold text-deep">{p.heading}</h3>
      <p className="mt-2 text-sm leading-relaxed text-earth">{p.intro}</p>

      <div
        className={`relative mt-4 w-full overflow-hidden rounded-xl border border-gold/15 bg-parchment-muted/50 ${embedHeightClass}`}
      >
        <iframe
          title="Lambeth parking restrictions map near CHCS Temple"
          src={mapUrl}
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
            aria-label={p.overlayCta}
          >
            <span className="max-w-sm rounded-lg border border-gold/50 bg-parchment/95 px-4 py-2.5 text-sm font-semibold text-deep shadow-md">
              {p.overlayCta}
            </span>
          </button>
        ) : null}
      </div>

      <p className="mt-3 text-center text-sm">
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-gold-dim underline-offset-4 hover:text-deep hover:underline"
        >
          {p.openFullMapLabel}
        </a>
      </p>
    </div>
  );
}
