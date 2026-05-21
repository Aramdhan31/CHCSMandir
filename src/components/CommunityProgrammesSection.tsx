import Link from "next/link";
import { communityProgrammes, visit } from "@/content/site";

export function CommunityProgrammesSection() {
  return (
    <section
      id="community"
      className="border-t border-gold/15 bg-parchment-muted/50 py-16 sm:py-20"
      aria-labelledby="community-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="max-w-3xl">
          <h2
            id="community-heading"
            className="font-display text-3xl font-semibold text-deep sm:text-4xl"
          >
            {communityProgrammes.sectionTitle}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-earth">
            {communityProgrammes.intro}
          </p>
        </header>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {communityProgrammes.items.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-gold/25 bg-white/90 p-6 shadow-md ring-1 ring-gold/15 sm:p-7"
            >
              <h3 className="font-display text-xl font-semibold text-deep">
                {item.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-earth">{item.detail}</p>
              {item.detail.toLowerCase().includes("email") ? (
                <p className="mt-4 text-sm">
                  <a
                    href={`mailto:${visit.email}`}
                    className="font-semibold text-gold-dim underline-offset-4 hover:text-deep hover:underline"
                  >
                    {visit.email}
                  </a>
                </p>
              ) : null}
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-sm text-earth">
          <Link
            href={communityProgrammes.visitCtaHash}
            className="font-semibold text-gold-dim underline-offset-4 hover:text-deep hover:underline"
          >
            {communityProgrammes.visitCtaLabel}
          </Link>
        </p>
      </div>
    </section>
  );
}
