"use client";

import { useEffect } from "react";

/**
 * Privacy deterrent: block the usual “save image” / drag gestures on most images.
 * Elements (or ancestors) with `data-allow-image-context` are skipped (e.g. optional lightbox opt-in).
 * Screenshots from the OS are not controllable from the page.
 */
export function ImagePrivacyGuard() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-allow-image-context]")) return;

      const img = target.closest?.("img, picture, svg, video") as HTMLElement | null;
      if (!img) return;

      e.preventDefault();
    };

    const onDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-allow-image-context]")) return;

      const img = target.closest?.("img, picture, svg") as HTMLElement | null;
      if (!img) return;

      e.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  return null;
}

