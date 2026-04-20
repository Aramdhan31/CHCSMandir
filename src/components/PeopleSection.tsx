import { people } from "@/content/site";

export function PeopleSection() {
  return (
    <section id="people" className="border-t border-gold/15 bg-parchment py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-deep sm:text-4xl">
          {people.sectionTitle}
        </h2>
        <div className="mt-8 space-y-6 text-left text-lg leading-relaxed text-earth sm:text-center sm:text-lg">
          {people.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
