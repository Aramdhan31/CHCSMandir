/** Must match `id` on `SiteHeader`’s `<header>` (used to clear sticky nav). */
export const SITE_HEADER_ID = "site-header";

const GAP_PX = 6;

function headerBlockHeightPx(): number {
  const el = document.getElementById(SITE_HEADER_ID);
  if (!el) return 96;
  return Math.ceil(el.getBoundingClientRect().height);
}

export function scrollBehaviorPreference(): ScrollBehavior {
  if (typeof window === "undefined") return "smooth";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

/**
 * Places `el`’s top edge just below the measured sticky site header.
 * More reliable than `scrollIntoView` + `scroll-padding` when invoked from JS.
 */
export function scrollDocumentToElement(
  el: HTMLElement,
  behavior: ScrollBehavior = scrollBehaviorPreference(),
): void {
  const headerH = headerBlockHeightPx();
  const docTop = el.getBoundingClientRect().top + window.scrollY;
  const top = docTop - headerH - GAP_PX;
  window.scrollTo({ top: Math.max(0, top), behavior });
}

/** Double rAF: layout after Next paint / mobile menu close. */
export function queueScrollToElement(
  el: HTMLElement,
  behavior: ScrollBehavior = scrollBehaviorPreference(),
): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => scrollDocumentToElement(el, behavior));
  });
}

export function scrollToElementId(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  scrollDocumentToElement(el, scrollBehaviorPreference());
  return true;
}

export function queueScrollToElementId(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  queueScrollToElement(el, scrollBehaviorPreference());
  return true;
}
