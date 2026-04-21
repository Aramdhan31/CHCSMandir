import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { canManageEventsAdmin } from "@/lib/admin/eventsAccess";
import {
  MEMBERSHIPS_ADMIN_COOKIE,
  parseMembershipsRole,
} from "@/lib/memberships/adminCookie";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Committee admin",
  robots: { index: false, follow: false },
};

export default async function AdminHubPage() {
  const jar = await cookies();
  const eventsOk = canManageEventsAdmin(jar);
  const memRole = parseMembershipsRole(jar.get(MEMBERSHIPS_ADMIN_COOKIE)?.value);

  return (
    <div className="min-h-screen bg-parchment bg-grain text-ink">
      <header className="border-b border-gold/25 bg-deep/95 text-parchment">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-gold">
              {site.nameShort} — committee
            </p>
            <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">Admin home</h1>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href="/admin/logout"
              className="rounded-full border-2 border-gold/50 px-4 py-2.5 text-base font-semibold text-gold transition hover:border-gold hover:text-parchment"
            >
              Log out
            </Link>
            <Link
              href="/"
              className="rounded-full border-2 border-gold/50 px-4 py-2.5 text-base font-semibold text-gold transition hover:border-gold hover:text-parchment"
            >
              ← Main site
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 sm:py-10">
        <p className="text-lg leading-relaxed text-earth sm:text-xl">
          Choose a section. Everything is sized for quick use on a phone.
        </p>

        <div className="grid gap-4 sm:gap-5">
          <section
            className={`rounded-2xl border-2 p-5 shadow-sm sm:p-6 ${
              eventsOk ? "border-gold/30 bg-white/90" : "border-earth/20 bg-white/70"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-deep sm:text-2xl">Events</h2>
              {eventsOk ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-950">
                  Signed in
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-base leading-relaxed text-earth sm:text-lg">
              Highlighted dates on the public site, optional photos.
            </p>
            {memRole === "view" && !eventsOk ? (
              <p className="mt-2 text-sm leading-snug text-earth/90">
                Your current sign-in is <strong className="text-deep">memberships view-only</strong>. To
                edit events, use <strong className="text-deep">Sign in for events</strong> with a PIN
                that includes events access (or the full committee PIN).
              </p>
            ) : null}
            {eventsOk ? (
              <Link
                href="/admin/events"
                className="mt-5 inline-flex min-h-[3.5rem] w-full items-center justify-center rounded-full bg-gold px-6 text-lg font-bold text-deep transition hover:bg-saffron sm:text-xl"
              >
                Open events admin
              </Link>
            ) : (
              <Link
                href="/admin/login?next=/admin/events"
                className="mt-5 inline-flex min-h-[3.5rem] w-full items-center justify-center rounded-full border-2 border-gold/60 bg-white px-6 text-lg font-bold text-deep transition hover:border-gold hover:bg-amber-50/80 sm:text-xl"
              >
                Sign in for events
              </Link>
            )}
          </section>

          <section
            className={`rounded-2xl border-2 p-5 shadow-sm sm:p-6 ${
              memRole ? "border-gold/30 bg-white/90" : "border-earth/20 bg-white/70"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-deep sm:text-2xl">Memberships</h2>
              {memRole === "edit" ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-950">
                  Edit access
                </span>
              ) : memRole === "view" ? (
                <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-950">
                  View only
                </span>
              ) : (
                <span className="rounded-full bg-earth/10 px-3 py-1 text-sm font-semibold text-earth">
                  Not signed in
                </span>
              )}
            </div>
            <p className="mt-3 text-base leading-relaxed text-earth sm:text-lg">
              Yearly membership payment lines, CSV import/export.
            </p>
            {memRole ? (
              <Link
                href="/admin/memberships"
                className="mt-5 inline-flex min-h-[3.5rem] w-full items-center justify-center rounded-full bg-gold px-6 text-lg font-bold text-deep transition hover:bg-saffron sm:text-xl"
              >
                Open membership admin
              </Link>
            ) : (
              <Link
                href="/admin/login?next=/admin/memberships"
                className="mt-5 inline-flex min-h-[3.5rem] w-full items-center justify-center rounded-full border-2 border-gold/60 bg-white px-6 text-lg font-bold text-deep transition hover:border-gold hover:bg-amber-50/80 sm:text-xl"
              >
                Sign in for memberships
              </Link>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
