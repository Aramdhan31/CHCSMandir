import { visit } from "@/content/site";

export function MembershipSection() {
  return (
    <section
      id="membership"
      className="border-t border-gold/15 bg-parchment-muted/40 py-14 sm:py-16"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl border border-gold/30 bg-deep/5 p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-deep sm:text-3xl">
            {visit.membershipHeading}
          </h2>
          <div className="mt-4 max-w-prose space-y-3 text-earth">
            {visit.membershipParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
