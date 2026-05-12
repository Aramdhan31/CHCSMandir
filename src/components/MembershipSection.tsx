import Image from "next/image";
import { visit } from "@/content/site";
import { MembershipPayForm } from "@/components/MembershipPayForm";

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
          <div className="grid gap-8 lg:grid-cols-[1fr_17.5rem] lg:items-start lg:gap-10">
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-semibold text-deep sm:text-3xl">
                {visit.membershipHeading}
              </h2>
              <div className="mt-4 max-w-prose space-y-3 text-earth">
                {visit.membershipParagraphs.map((p, i) => (
                  <p key={i}>{renderParagraphWithEmail(p)}</p>
                ))}
              </div>
            </div>

            <div className="hidden shrink-0 justify-self-end lg:block lg:w-full">
              <div className="relative mx-auto aspect-square w-full max-w-[17.5rem]">
                <Image
                  src="/ganesh-bhagwan.png"
                  alt="Lord Ganesh"
                  fill
                  sizes="(max-width: 1024px) 0px, 280px"
                  className="object-contain object-center"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 min-w-0 lg:mt-8">
            <MembershipPayForm />
          </div>
        </div>
      </div>
    </section>
  );
}
