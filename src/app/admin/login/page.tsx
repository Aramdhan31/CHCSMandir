import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { UnifiedAdminLoginForm } from "@/components/admin/UnifiedAdminLoginForm";
import { site } from "@/content/site";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

function safeNextFromSearch(raw: string | undefined): string {
  if (!raw) return "/admin";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/admin";
  if (!t.startsWith("/admin")) return "/admin";
  if (t === "/admin" || t === "/admin/") return "/admin";
  if (t.startsWith("/admin/events")) return t;
  if (t.startsWith("/admin/memberships")) return t;
  return "/admin";
}

function signInHeading(nextPath: string): string {
  if (nextPath.startsWith("/admin/events")) return "Sign in to Events";
  if (nextPath.startsWith("/admin/memberships")) return "Sign in to Memberships";
  return "Sign in";
}

function signInIntro(nextPath: string): ReactNode {
  if (nextPath.startsWith("/admin/events")) {
    return (
      <>
        For <strong className="text-deep">committee use only</strong>. Enter the PIN you were given
        for <strong className="text-deep">events</strong>, then you will return to the Events admin
        page to add or change what visitors see on the main site.
      </>
    );
  }
  if (nextPath.startsWith("/admin/memberships")) {
    return (
      <>
        For <strong className="text-deep">committee use only</strong>. Enter the PIN you were given
        for <strong className="text-deep">memberships</strong>, then you will return to the
        membership admin area.
      </>
    );
  }
  return (
    <>
      For <strong className="text-deep">committee use only</strong>. Enter the PIN you were given,
      then open the large shortcuts to <strong className="text-deep">events</strong> or{" "}
      <strong className="text-deep">memberships</strong> from the admin home.
    </>
  );
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const nextPath = safeNextFromSearch(sp.next);
  const segment = nextPath.startsWith("/admin/events")
    ? "Events"
    : nextPath.startsWith("/admin/memberships")
      ? "Memberships"
      : "Committee";
  return {
    title: `${site.nameShort} — ${segment} sign-in`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const nextPath = safeNextFromSearch(sp.next);
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen bg-parchment bg-grain text-ink">
      <header className="border-b border-gold/25 bg-deep/95 text-parchment">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-gold">
              {site.nameShort} — committee
            </p>
            <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
              {signInHeading(nextPath)}
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

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl border-2 border-gold/25 bg-white/90 p-5 shadow-sm sm:p-10">
          <p className="text-lg leading-relaxed text-earth sm:text-xl">{signInIntro(nextPath)}</p>
          {isDev ? (
            <p className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-base text-amber-950 sm:text-lg">
              <strong className="font-semibold">Local development:</strong> how PINs are configured
              and which test values apply when env vars are unset is documented in{" "}
              <code className="text-sm">.env.example</code> — not shown here on purpose.
            </p>
          ) : null}
          <div className="mt-10">
            <UnifiedAdminLoginForm nextPath={nextPath} />
          </div>
        </div>
      </div>
    </div>
  );
}
