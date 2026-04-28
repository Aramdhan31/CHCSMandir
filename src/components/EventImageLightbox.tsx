"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";

export function EventImageLightbox({
  src,
  alt,
  sizes,
  className,
  enable,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  /** If false, renders a normal non-clickable image. */
  enable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const clickable = enable !== false;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={clickable ? () => setOpen(true) : undefined}
        disabled={!clickable}
        className={`relative h-full w-full ${clickable ? "cursor-zoom-in" : ""}`}
        aria-label={clickable ? "Open event image" : undefined}
      >
        <Image src={src} alt={alt} fill sizes={sizes} className={className} />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between gap-4 pb-3">
              <p id={titleId} className="truncate font-display text-sm font-semibold text-white/90">
                {alt}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                Close
              </button>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/30 shadow-2xl">
              <div className="relative h-[min(80vh,48rem)] w-full">
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="100vw"
                  className="object-contain object-center"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

