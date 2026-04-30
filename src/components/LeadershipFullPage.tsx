import Image from "next/image";
import Link from "next/link";
import { leadership, leadershipPageMeta } from "@/content/site";

function PageOrnament({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-gold/60 ${className ?? ""}`}
      aria-hidden
    >
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/70 sm:w-20" />
      <svg className="h-8 w-8 shrink-0" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="0.75" />
        <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="0.75" />
        <path d="M16 1v6M16 25v6M1 16h6M25 16h6" stroke="currentColor" strokeWidth="0.75" />
      </svg>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/70 sm:w-20" />
    </div>
  );
}

export function LeadershipFullPage() {
  const showExecutive = leadership.showExecutiveNames !== false;
  const showCommittee = leadership.showCommitteeNames !== false;
  const showAdmin = leadership.showAdminNames !== false;
  const showAnyExec = showExecutive || showCommittee || showAdmin;
  const hasPatrons =
    "patrons" in leadership && Array.isArray(leadership.patrons) && leadership.patrons.length > 0;
  const singleCurrentPandit = leadership.priestsCurrent.length === 1;
  const groupedPastPriests = (() => {
    const map = new Map<
      string,
      {
        name: string;
        years: string[];
        imageSrc?: string;
        imageAlt?: string;
        imageClass?: string;
      }
    >();

    for (const p of leadership.pastPriests) {
      const key = p.name.trim();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name: p.name,
          years: [p.years],
          ...(("imageSrc" in p && p.imageSrc ? { imageSrc: p.imageSrc } : {}) as object),
          ...(("imageAlt" in p && p.imageAlt ? { imageAlt: p.imageAlt } : {}) as object),
          ...(("imageClass" in p && p.imageClass
            ? { imageClass: p.imageClass }
            : {}) as object),
        });
        continue;
      }

      if (!existing.years.includes(p.years)) existing.years.push(p.years);
      if (!existing.imageSrc && "imageSrc" in p && p.imageSrc) existing.imageSrc = p.imageSrc;
      if (!existing.imageAlt && "imageAlt" in p && p.imageAlt) existing.imageAlt = p.imageAlt;
      if (!existing.imageClass && "imageClass" in p && p.imageClass)
        existing.imageClass = p.imageClass;
    }

    return Array.from(map.values());
  })();

  const pastPriestsOrdered = (() => {
    const parseYears = (s: string) => {
      const nums = s.match(/\d{4}/g)?.map((n) => Number(n)) ?? [];
      const start = nums[0] ?? 0;
      const end = nums[1] ?? start;
      return { start, end };
    };

    return [...groupedPastPriests]
      .map((p) => {
        const spans = p.years.map(parseYears);
        const sortKey = Math.max(...spans.map((x) => x.end), 0);
        return { ...p, sortKey };
      })
      .sort((a, b) => b.sortKey - a.sortKey);
  })();

  return (
    <div className="bg-parchment text-ink">
      {/* Hero */}
      <header className="relative overflow-hidden bg-deep bg-grain text-parchment">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-30%,rgba(201,162,39,0.28),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <nav
            className="mb-10 flex justify-center text-sm text-parchment-muted"
            aria-label="Breadcrumb"
          >
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href="/"
                  className="font-medium text-gold transition hover:text-parchment"
                >
                  {leadershipPageMeta.breadcrumbHome}
                </Link>
              </li>
              <li aria-hidden className="text-parchment-muted/60">
                /
              </li>
              <li className="font-medium text-parchment">{leadership.sectionTitle}</li>
            </ol>
          </nav>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.4em] text-gold">
            {leadershipPageMeta.heroEyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {leadership.sectionTitle}
          </h1>
          <PageOrnament className="mt-8" />
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-parchment-muted">
            {leadership.intro}
          </p>
        </div>
      </header>

      {hasPatrons ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="rounded-3xl border border-gold/25 bg-white/80 p-8 shadow-sm sm:p-10">
            <div className="text-center">
              <h2 className="font-display text-2xl font-semibold text-deep sm:text-3xl">
                {"patronsHeading" in leadership && leadership.patronsHeading
                  ? leadership.patronsHeading
                  : "Patrons"}
              </h2>
              <PageOrnament className="mt-6" />
            </div>
            <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
              {leadership.patrons.map((name) => (
                <li
                  key={name}
                  className="rounded-2xl border border-gold/15 bg-parchment/40 px-5 py-4 text-center text-earth shadow-sm"
                >
                  <p className="font-display text-lg font-semibold text-deep">{name}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {showAnyExec ? (
        /* Executive committee — card grid */
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold text-deep sm:text-3xl">
              {leadership.executiveTitle}
            </h2>
            <PageOrnament className="mt-6" />
          </div>

          {showExecutive ? (
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {leadership.roles.map((r) => (
                <li key={r.role}>
                  <div className="relative h-full overflow-hidden rounded-2xl border border-gold/25 bg-white p-6 shadow-sm transition hover:border-gold/50 hover:shadow-md">
                    <div
                      className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-90"
                      aria-hidden
                    />
                    <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold-dim">
                      {r.role}
                    </p>
                    <p className="mt-4 font-display text-xl font-semibold text-deep">{r.name}</p>
                    {"subtitle" in r && r.subtitle ? (
                      <p className="mt-2 text-sm leading-relaxed text-earth/80">{r.subtitle}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {showCommittee || showAdmin ? (
            <div className="mt-20 grid gap-14 lg:grid-cols-2">
              {showCommittee ? (
                <div>
                  <h3 className="font-display text-xl font-semibold text-deep">
                    {leadership.committeeHeading}
                  </h3>
                  <ul className="mt-6 space-y-3">
                    {leadership.committeeMembers.map((n) => (
                      <li
                        key={n}
                        className="flex items-center gap-3 rounded-xl border border-gold/15 bg-white/90 px-4 py-3 text-earth shadow-sm"
                      >
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full bg-gold"
                          aria-hidden
                        />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {showAdmin ? (
                <div>
                  <h3 className="font-display text-xl font-semibold text-deep">
                    {leadership.adminHeading}
                  </h3>
                  <ul className="mt-6 space-y-3">
                    {leadership.adminMembers.map((n) => (
                      <li
                        key={n}
                        className="flex items-center gap-3 rounded-xl border border-gold/15 bg-white/90 px-4 py-3 text-earth shadow-sm"
                      >
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full bg-saffron/80"
                          aria-hidden
                        />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Pandits */}
      <section className="border-t border-gold/20 bg-deep bg-grain py-16 text-parchment sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              {leadership.priestsTitle}
            </h2>
            <PageOrnament className="mt-6" />
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {leadership.priestsCurrent.map((p) => {
              const isChief = p.role === "Current Pandit";
              return (
                <div
                  key={p.role}
                  className={`relative overflow-hidden rounded-3xl border p-8 sm:p-10 ${
                    isChief
                      ? "border-gold/50 bg-[linear-gradient(145deg,rgba(201,162,39,0.12)_0%,rgba(42,24,16,0.95)_55%)] shadow-[0_0_0_1px_rgba(201,162,39,0.15)]"
                      : "border-parchment/15 bg-parchment/5"
                  } ${isChief && singleCurrentPandit ? "lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-3xl" : ""}`}
                >
                  {isChief ? (
                    <p className="absolute right-6 top-6 font-display text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-gold">
                      Pradhān
                    </p>
                  ) : null}
                  {"imageSrc" in p && p.imageSrc ? (
                    <div className="mb-7 flex justify-center">
                      <div className="relative h-44 w-44 overflow-hidden rounded-3xl border border-gold/35 bg-parchment/10 shadow-[0_18px_55px_-24px_rgba(0,0,0,0.75)] ring-1 ring-parchment/10">
                        <Image
                          src={p.imageSrc}
                          alt={"imageAlt" in p && p.imageAlt ? p.imageAlt : p.name}
                          fill
                          sizes="176px"
                          className="origin-center scale-[1.15] object-cover object-[42%_6%]"
                          priority={isChief}
                        />
                      </div>
                    </div>
                  ) : null}
                  <p
                    className={`font-display text-xs font-semibold uppercase tracking-[0.3em] text-gold/90 ${
                      isChief ? "text-center" : ""
                    }`}
                  >
                    {p.role}
                  </p>
                  <p
                    className={`mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl ${
                      isChief ? "text-center" : ""
                    }`}
                  >
                    {p.name}
                  </p>
                  <p
                    className={`mt-4 text-parchment-muted ${
                      isChief ? "mx-auto max-w-md text-center" : "max-w-md"
                    }`}
                  >
                    {isChief
                      ? "Leading worship, festivals, and scripture at CHCS."
                      : "Supporting the Mandir’s religious programmes alongside the Pandit."}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-16 sm:mt-20">
            <h3 className="text-center font-display text-xl font-semibold text-gold sm:text-2xl">
              {leadership.pastHeading}
            </h3>

            <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pastPriestsOrdered.map((p) => {
                const isPlaceholder = !p.imageSrc;
                const imageSrc = p.imageSrc ?? "/pandit-placeholder.svg";
                const imageAlt = p.imageAlt ?? `${p.name} — photo coming soon`;
                const imageClass = isPlaceholder
                  ? "object-contain object-center p-4 opacity-80"
                  : p.imageClass ?? "origin-center scale-[1.15] object-cover object-[50%_8%]";

                return (
                  <div
                    key={`past-card-${p.name}`}
                    className="relative overflow-hidden rounded-2xl border border-parchment/15 bg-parchment/5 p-6 text-center shadow-sm"
                  >
                    <div className="mx-auto mb-4 flex justify-center">
                      <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-parchment/20 bg-parchment/10 ring-1 ring-parchment/10">
                        <Image
                          src={imageSrc}
                          alt={imageAlt}
                          fill
                          sizes="112px"
                          className={imageClass}
                        />
                      </div>
                    </div>
                    <p className="font-display text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold/90">
                      {p.years.join(" • ")}
                    </p>
                    <p className="mt-2 font-display text-lg font-semibold text-parchment">
                      {p.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-gold/15 bg-parchment py-10 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-sm font-semibold text-gold-dim underline-offset-4 hover:text-deep hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
