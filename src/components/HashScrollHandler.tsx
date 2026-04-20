"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { queueScrollToElementId } from "@/lib/scrollToHashTarget";

function hashId(): string | null {
  if (typeof window === "undefined") return null;
  const h = window.location.hash;
  if (!h || h.length < 2) return null;
  try {
    return decodeURIComponent(h.slice(1));
  } catch {
    return h.slice(1);
  }
}

/**
 * Next.js client navigations do not always run native hash scrolling; this
 * retries until the target section exists (e.g. after RSC paint).
 */
export function HashScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    const id = hashId();
    if (!id) return;
    let cancelled = false;
    let tries = 0;
    const run = () => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (el) {
        queueScrollToElementId(id);
        return;
      }
      tries += 1;
      if (tries < 30) window.setTimeout(run, 45);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const onHashChange = () => {
      const id = hashId();
      if (!id) return;
      queueScrollToElementId(id);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
