"use client";

import { useEffect } from "react";

/**
 * Privacy deterrent: prevent the common "save / open image in new tab" gestures.
 * Not a perfect DRM solution (screenshots are always possible).
 */
export function ImagePrivacyGuard() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const img = target.closest?.("img, picture, svg, video") as HTMLElement | null;
      if (!img) return;

      e.preventDefault();
    };

    const onDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
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

