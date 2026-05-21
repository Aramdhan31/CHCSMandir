import { communityProgrammes } from "@/content/site";

/** Compact list used inside Visit us (and anywhere else on the page). */
export function CommunityProgrammesBlock() {
  if (!communityProgrammes.items.length) return null;

  return (
    <div className="mt-6 rounded-xl border border-gold/15 bg-parchment/40 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-dim">
        {communityProgrammes.sectionTitle}
      </p>
      <ul className="mt-3 space-y-2 text-sm text-earth">
        {communityProgrammes.items.map((item) => (
          <li key={item.title} className="leading-relaxed">
            <span className="font-semibold text-deep">{item.title}:</span>{" "}
            <span>{item.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
