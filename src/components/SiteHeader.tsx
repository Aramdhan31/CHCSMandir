"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  queueScrollToElement,
  scrollBehaviorPreference,
} from "@/lib/scrollToHashTarget";
import { brand, leadershipPageMeta, site } from "@/content/site";

const nav = [
  { label: "Home", href: "/#home" },
  { label: "About us", href: "/about" },
  { label: "EC & pandits", href: leadershipPageMeta.path },
  { label: "Events", href: "/#events" },
  { label: "Our people", href: "/#people" },
  { label: "Facebook", href: "/#connect" },
  { label: "Visit", href: "/#visit" },
] as const;

/** Last word on its own line, centred under the first line (header wordmark). */
function splitNameForNav(full: string): { line1: string; line2: string } | null {
  const i = full.lastIndexOf(" ");
  if (i <= 0) return null;
  return { line1: full.slice(0, i), line2: full.slice(i + 1) };
}

export function SiteHeader() {
  const pathname = usePathname();
  const navName = splitNameForNav(site.nameFull);
  const [open, setOpen] = useState(false);

  const headerBar = (
    <header
      id="site-header"
      className="sticky top-0 z-50 border-b border-gold/25 bg-deep/88 text-parchment shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl flex-nowrap items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
          <Link
            href="/#home"
            className="flex min-w-0 max-w-[calc(100%-3.25rem)] flex-1 items-center gap-2.5 rounded-md outline-none ring-gold/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-deep sm:max-w-none sm:gap-3 md:flex-initial"
            onClick={(e) => {
              if (pathname !== "/") return;
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              window.history.pushState(null, "", "/#home");
              const home = document.getElementById("home");
              if (home) queueScrollToElement(home, scrollBehaviorPreference());
            }}
          >
            <span className="flex shrink-0 items-center leading-none">
              {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset from /public */}
              <img
                src={brand.logoSrc}
                alt={brand.logoAlt}
                width={320}
                height={320}
                decoding="async"
                fetchPriority="high"
                className="navbar-logo block h-14 w-auto max-h-14 max-w-[min(72vw,15rem)] object-contain object-left drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] sm:h-16 sm:max-h-16 sm:max-w-[17rem] md:h-[4.5rem] md:max-h-[4.5rem]"
              />
            </span>
            <span className="font-display flex min-w-0 flex-1 flex-col items-start justify-center text-sm font-semibold leading-snug tracking-tight text-gold sm:text-base md:text-lg md:leading-tight">
              {navName ? (
                <span className="inline-flex max-w-full flex-col self-start">
                  <span className="text-left">{navName.line1}</span>
                  <span className="w-full text-center">{navName.line2}</span>
                </span>
              ) : (
                site.nameFull
              )}
            </span>
          </Link>
          <button
            type="button"
          className={`relative z-[60] flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 rounded-md border shadow-sm backdrop-blur-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-deep md:hidden ${
            open
              ? "border-gold/60 bg-deep/70 text-parchment hover:border-gold hover:bg-deep/80"
              : "border-parchment/35 bg-parchment/10 text-deep hover:border-gold/50 hover:bg-parchment/15"
          }`}
            aria-expanded={open}
            aria-controls="primary-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          >
            <span
            className={`block h-0.5 w-5 rounded-full bg-current transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
            />
          <span className={`block h-0.5 w-5 rounded-full bg-current ${open ? "opacity-0" : ""}`} />
            <span
            className={`block h-0.5 w-5 rounded-full bg-current transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </button>
          {open ? (
            <button
              type="button"
              aria-label="Close menu overlay"
              className="fixed inset-0 z-[54] bg-deep/95 md:hidden"
              onClick={() => setOpen(false)}
            />
          ) : null}
          <nav
            id="primary-nav"
          className={`absolute left-0 right-0 top-full z-[55] max-h-[min(70dvh,calc(100dvh-5rem))] overflow-y-auto border-b border-gold/20 bg-deep px-4 py-4 shadow-lg md:static md:z-auto md:block md:max-h-none md:overflow-visible md:border-0 md:bg-transparent md:p-0 md:shadow-none ${open ? "block" : "hidden"}`}
            aria-label="Primary"
          >
            <ul className="flex flex-col gap-1 md:flex-row md:items-center md:gap-6">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                  className="block rounded-md px-2 py-3 text-sm font-medium text-parchment/95 transition-colors hover:bg-white/10 hover:text-gold md:py-1 md:text-earth md:hover:bg-transparent md:hover:text-gold-dim"
                    onClick={(e) => {
                      if (item.href.startsWith("/#") && pathname === "/") {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                          setOpen(false);
                          return;
                        }
                        const id = item.href.slice(2);
                        if (id) {
                          e.preventDefault();
                          window.history.pushState(null, "", item.href);
                          const target = document.getElementById(id);
                          if (target) queueScrollToElement(target, scrollBehaviorPreference());
                        }
                      }
                      setOpen(false);
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
    </header>
  );

  return headerBar;
}
