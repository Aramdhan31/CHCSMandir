import Image from "next/image";
import { visit } from "@/content/site";

export function MembershipSection() {
  const bank = visit.membershipBank;
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
                  <p key={i}>{p}</p>
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

          <div className="mt-8 rounded-2xl border border-gold/25 bg-white/80 p-5 shadow-sm sm:p-6">
            <h3 className="font-display text-xl font-semibold text-deep sm:text-2xl">
              {visit.membershipBankHeading}
            </h3>
            <dl className="mt-4 grid gap-4 text-earth sm:grid-cols-3">
              <div className="rounded-xl border border-gold/15 bg-parchment/40 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gold-dim">
                  {bank.bankNameLabel}
                </dt>
                <dd className="mt-1 font-display text-lg font-semibold text-deep">
                  {bank.bankName}
                </dd>
              </div>
              <div className="rounded-xl border border-gold/15 bg-parchment/40 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gold-dim">
                  {bank.accountNumberLabel}
                </dt>
                <dd className="mt-1 font-display text-lg font-semibold text-deep">
                  {bank.accountNumber}
                </dd>
              </div>
              <div className="rounded-xl border border-gold/15 bg-parchment/40 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gold-dim">
                  {bank.sortCodeLabel}
                </dt>
                <dd className="mt-1 font-display text-lg font-semibold text-deep">
                  {bank.sortCode}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
