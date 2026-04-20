import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Membership admin",
  robots: { index: false, follow: false },
};

export default function AdminMembershipsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-parchment bg-grain text-ink">
      <header className="border-b border-gold/25 bg-deep/95 text-parchment">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-gold">
              {site.nameShort} — committee
            </p>
            <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
              Yearly memberships
            </h1>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-full border-2 border-gold/50 px-4 py-2.5 text-base font-semibold text-gold transition hover:border-gold hover:text-parchment"
          >
            ← Main site
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
