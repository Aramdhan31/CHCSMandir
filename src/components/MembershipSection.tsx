import Image from "next/image";
import { visit } from "@/content/site";

function renderParagraphWithEmail(p: string) {
  const email = visit.email;
  if (!p.includes(email)) return p;

  const parts = p.split(email);
  return (
    <>
      {parts[0]}
      <a
        href={`mailto:${email}`}
        className="font-semibold text-gold-dim underline underline-offset-4 hover:text-deep"
      >
        {email}
      </a>
      {parts.slice(1).join(email)}
    </>
  );
}

export function MembershipSection() {
  return (
    <section
      id="membership"
      className="border-t border-gold/15 bg-parchment-muted/40 py-14 sm:py-16"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl border border-gold/30 bg-deep/5 p-6 shadow-sm sm:p-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <h2 className="font-display text-2xl font-semibold text-deep sm:text-3xl">
                {visit.membershipHeading}
              </h2>
              <div className="mt-4 max-w-prose space-y-3 text-earth">
                {visit.membershipParagraphs.map((p, i) => (
                  <p key={i}>{renderParagraphWithEmail(p)}</p>
                ))}
              </div>
            </div>

            <div className="hidden justify-self-end lg:block">
              <div className="relative h-80 w-80">
                <Image
                  src="/ganesh-bhagwan.png"
                  alt="Lord Ganesh"
                  fill
                  sizes="320px"
                  className="object-contain object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
