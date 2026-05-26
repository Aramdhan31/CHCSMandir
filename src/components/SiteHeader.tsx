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
  { label: "EC & Pandits", href: leadershipPageMeta.path },
  { label: "Events", href: "/#events" },
  { label: "Community", href: "/#community" },
  { label: "Membership", href: "/#membership" },
  { label: "Our people", href: "/#people" },
  { label: "Facebook", href: "/#connect" },
  { label: "Visit", href: "/#visit" },
] as const;

function splitNameForNav(full: string): { line1: string; line2: string } | null {
  const i = full.lastIndexOf(" ");
  if (i <= 0) return null;
  return { line1: full.slice(0, i), line2: full.slice(i + 1) };
}

const linkClass =
  "inline-block whitespace-nowrap rounded-md px-1.5 py-1 text-[0.8125rem] font-medium leading-none text-parchment transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deep lg:px-2 lg:text-sm";

export function SiteHeader() {
  const pathname = usePathname();
  const navName = splitNameForNav(site.nameFull);
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <header
      id="site-header"
      className="sticky top-0 z-50 border-b border-gold/25 bg-deep text-parchment shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)]"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-3 py-3 sm:gap-4">
          <Link
            href="/#home"
            className="flex shrink-0 items-center gap-2.5 rounded-md outline-none ring-gold/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-deep sm:gap-3"
            onClick={(e) => {
              if (pathname !== "/") return;
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              window.history.pushState(null, "", "/#home");
              const home = document.getElementById("home");
              if (home) queueScrollToElement(home, scrollBehaviorPreference());
            }}
          >
            <span className="flex shrink-0 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.logoSrc}
                alt={brand.logoAlt}
                width={320}
                height={320}
                decoding="async"
                fetchPriority="high"
                className="navbar-logo block h-11 w-auto max-h-11 object-contain sm:h-12 sm:max-h-12 lg:h-14 lg:max-h-14"
              />
            </span>
            <span className="font-display hidden flex-col leading-tight text-gold sm:flex">
              {navName ? (
                <>
                  <span className="whitespace-nowrap text-xs font-semibold sm:text-sm lg:text-base">
                    {navName.line1}
                  </span>
                  <span className="whitespace-nowrap text-center text-xs font-semibold sm:text-sm lg:text-base">
                    {navName.line2}
                  </span>
                </>
              ) : (
                <span className="whitespace-nowrap text-sm font-semibold">{site.nameFull}</span>
              )}
            </span>
          </Link>

          {/* Desktop/tablet: links on the same row as the society name */}
          <nav
            id="primary-nav"
            className="hidden min-w-0 flex-1 md:block"
            aria-label="Primary"
          >
            <ul className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 lg:gap-x-3">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={linkClass}
                    onClick={(e) => {
                      if (item.href.startsWith("/#") && pathname === "/") {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                        const id = item.href.slice(2);
                        if (id) {
                          e.preventDefault();
                          window.history.pushState(null, "", item.href);
                          const target = document.getElementById(id);
                          if (target) queueScrollToElement(target, scrollBehaviorPreference());
                        }
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <button
            type="button"
            className="ml-auto flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 rounded-md border border-parchment/35 bg-parchment/10 text-parchment md:hidden"
            aria-expanded={open}
            aria-controls="primary-nav-mobile"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span
              className={`block h-0.5 w-5 rounded-full bg-current transition-transform ${
                open ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-current transition-opacity ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-current transition-transform ${
                open ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>

        {/* Mobile menu */}
        {open ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-deep/90 md:hidden"
            onClick={closeMenu}
          />
        ) : null}
        <nav
          id="primary-nav-mobile"
          className={`relative z-50 border-t border-gold/20 pb-3 pt-2 md:hidden ${open ? "block" : "hidden"}`}
          aria-label="Primary mobile"
        >
          <ul className="flex flex-col gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${linkClass} w-full px-2 py-2.5 text-sm`}
                  onClick={(e) => {
                    if (item.href.startsWith("/#") && pathname === "/") {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                      const id = item.href.slice(2);
                      if (id) {
                        e.preventDefault();
                        window.history.pushState(null, "", item.href);
                        const target = document.getElementById(id);
                        if (target) queueScrollToElement(target, scrollBehaviorPreference());
                      }
                    }
                    closeMenu();
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
}
