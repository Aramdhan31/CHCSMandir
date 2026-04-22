import Link from "next/link";
import {
  getLeadershipHomeSpotlights,
  homeLeadership,
  leadership,
} from "@/content/site";

function DividerGlyph() {
  return (
    <svg
      className="mx-auto h-6 w-24 text-gold/50"
      viewBox="0 0 96 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M48 4v16M32 12h32M8 12h12M76 12h12"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="48" cy="12" r="3" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function LeadershipHomeTeaser() {
  const { pandit } = getLeadershipHomeSpotlights();

  const cards = [
    { ...pandit, accent: "from-gold/30 to-transparent" },
  ] as const;

  return (
    <section
      id="leadership"
      className="border-y border-gold/20 bg-[linear-gradient(180deg,var(--parchment)_0%,#f0e8db_45%,var(--parchment)_100%)] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.35em] text-gold-dim">
            {leadership.sectionTitle.split("&")[0].trim()}
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-deep sm:text-4xl">
            {homeLeadership.sectionTitle}
          </h2>
          <DividerGlyph />
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-earth">
            {homeLeadership.intro}
          </p>
        </header>

        <div className="mt-14 grid place-items-center gap-8">
          {cards.map((card) => (
            <article
              key={card.role}
              className="group relative w-full max-w-md overflow-hidden rounded-2xl border border-gold/25 bg-white/80 p-8 shadow-md transition hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-lg"
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${card.accent} opacity-80`}
                aria-hidden
              />
              <div className="relative">
                <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-gold-dim">
                  {card.role}
                </p>
                <p className="mt-4 font-display text-2xl font-semibold leading-snug text-deep sm:text-[1.65rem]">
                  {card.name}
                </p>
                <span
                  className="mt-6 block h-px w-12 bg-gradient-to-r from-gold to-transparent"
                  aria-hidden
                />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href={homeLeadership.ctaHref}
            className="inline-flex items-center gap-2 rounded-full border-2 border-gold/60 bg-deep px-8 py-3.5 font-display text-sm font-semibold tracking-wide text-parchment shadow-md transition hover:border-gold hover:bg-earth"
          >
            {homeLeadership.ctaLabel}
            <span aria-hidden className="text-gold">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
