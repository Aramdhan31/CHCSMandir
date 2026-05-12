"use client";

import { useCallback, useMemo, useState } from "react";
import { formatLondonDateLong, londonCalendarYear } from "@/lib/londonCalendar";
import { visit } from "@/content/site";

type PaymentChoice = "membership" | "membership_donation" | "donation";

function parsePositiveGbp(raw: string): number | null {
  const t = raw.trim().replace(/,/g, "");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0 || n > 100000) return null;
  return Math.round(n * 100) / 100;
}

const labelClass = "mb-1 block text-[0.65rem] font-bold uppercase tracking-[0.16em] text-gold-dim";

const inputClass =
  "w-full rounded-md border border-earth/20 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition placeholder:text-earth/35 focus:border-gold/55 focus:ring-2 focus:ring-gold/20";

const selectClass =
  "w-full cursor-pointer appearance-none rounded-md border border-earth/20 bg-white bg-[length:0.875rem] bg-[right_0.5rem_center] bg-no-repeat px-3 py-2 pr-9 text-sm text-ink shadow-sm outline-none transition focus:border-gold/55 focus:ring-2 focus:ring-gold/20 " +
  "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%235a3a2c%22 stroke-width=%222%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M19 9l-7 7-7-7%22/%3E%3C/svg%3E')]";

export function MembershipPayForm() {
  const fee = visit.membershipFeeGbp;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("membership");
  const [donationOnlyGbp, setDonationOnlyGbp] = useState("");
  const [donationExtraGbp, setDonationExtraGbp] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentUrl = visit.membershipPaymentUrl;

  const payload = useMemo(() => {
    const base = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      kind: paymentChoice,
      message: message.trim(),
    };
    if (paymentChoice === "membership") {
      return { ...base, kind: "membership" as const, amountGbp: String(fee) };
    }
    if (paymentChoice === "donation") {
      return { ...base, kind: "donation" as const, amountGbp: donationOnlyGbp.trim() };
    }
    return {
      ...base,
      kind: "membership_donation" as const,
      donationAmountGbp: donationExtraGbp.trim(),
    };
  }, [
    donationExtraGbp,
    donationOnlyGbp,
    email,
    fee,
    fullName,
    message,
    paymentChoice,
    phone,
  ]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!payload.fullName || !payload.phone) {
        setError("Please enter your name and phone.");
        return;
      }
      if (paymentChoice === "donation") {
        if (parsePositiveGbp(donationOnlyGbp) === null) {
          setError("Please enter how much you would like to donate.");
          return;
        }
      }
      if (paymentChoice === "membership_donation") {
        if (parsePositiveGbp(donationExtraGbp) === null) {
          setError("Please enter your extra donation amount (more than £0).");
          return;
        }
      }
      if (!paymentUrl) {
        setError("Payment link is missing.");
        return;
      }

      setBusy(true);
      try {
        const res = await fetch("/api/membership-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const msg = await res
            .json()
            .then((j) => (j && typeof j.error === "string" ? j.error : "Could not save your details."))
            .catch(() => "Could not save your details.");
          setError(msg);
          return;
        }
      } catch {
        setError("Could not save your details. Please try again.");
        return;
      }
      setBusy(false);
      window.location.href = paymentUrl;
    },
    [donationExtraGbp, donationOnlyGbp, paymentChoice, paymentUrl, payload],
  );

  const onPaymentChoiceChange = (next: PaymentChoice) => {
    setPaymentChoice(next);
    if (next === "membership") {
      setDonationOnlyGbp("");
      setDonationExtraGbp("");
    } else if (next === "donation") {
      setDonationExtraGbp("");
    } else {
      setDonationOnlyGbp("");
    }
  };

  const comboTotal =
    paymentChoice === "membership_donation"
      ? (() => {
          const extra = parsePositiveGbp(donationExtraGbp);
          return extra === null ? null : Math.round((fee + extra) * 100) / 100;
        })()
      : null;

  const extraParsed = parsePositiveGbp(donationExtraGbp);

  return (
    <div className="w-full min-w-0">
      <form
        onSubmit={onSubmit}
        className="relative overflow-hidden rounded-xl border border-gold/25 bg-white shadow-md"
        noValidate
      >
        <div className="h-1 w-full bg-gradient-to-r from-gold/70 to-saffron/90" aria-hidden />

        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/10 pb-3">
            <h3 className="font-display text-lg font-semibold tracking-tight text-deep sm:text-xl">
              Pay membership / donate
            </h3>
            <span className="rounded-full bg-deep/90 px-2 py-0.5 font-display text-[0.6rem] font-semibold uppercase tracking-wider text-parchment">
              1 / 2
            </span>
          </div>
          <p className="mt-2 text-xs text-earth/80">Details here, then SumUp to pay.</p>

          <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,14rem)] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] xl:gap-10">
            <div className="min-w-0 space-y-3">
              <label className="block min-w-0">
                <span className={labelClass}>Full name</span>
                <input
                  required
                  name="fullName"
                  autoComplete="name"
                  value={fullName}
                  onChange={(ev) => setFullName(ev.target.value)}
                  className={inputClass}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block min-w-0">
                  <span className={labelClass}>Email (optional)</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block min-w-0">
                  <span className={labelClass}>Phone</span>
                  <input
                    required
                    name="phone"
                    autoComplete="tel"
                    value={phone}
                    onChange={(ev) => setPhone(ev.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>I am paying for</span>
                <select
                  name="paymentChoice"
                  value={paymentChoice}
                  onChange={(ev) => onPaymentChoiceChange(ev.target.value as PaymentChoice)}
                  className={selectClass}
                >
                  <option value="membership">Membership (£{fee})</option>
                  <option value="membership_donation">Membership (£{fee}) + donation</option>
                  <option value="donation">Donation only</option>
                </select>
              </label>

              {paymentChoice === "membership" ? (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-earth/15 bg-parchment-muted/40 px-3 py-2 text-xs text-earth">
                  <span className="font-medium text-deep">Membership</span>
                  <span className="tabular-nums rounded border border-earth/20 bg-white/80 px-2 py-0.5 font-semibold text-earth/55">
                    £{fee.toFixed(2)}
                  </span>
                  <span className="text-earth/70">fixed — no amount field.</span>
                </div>
              ) : null}

              {paymentChoice === "donation" ? (
                <label className="block">
                  <span className={labelClass}>Donation (£)</span>
                  <input
                    required
                    name="amountGbp"
                    inputMode="decimal"
                    autoComplete="off"
                    value={donationOnlyGbp}
                    onChange={(ev) => setDonationOnlyGbp(ev.target.value)}
                    className={`${inputClass} tabular-nums`}
                    placeholder="e.g. 25"
                  />
                </label>
              ) : null}

              {paymentChoice === "membership_donation" ? (
                <div className="space-y-2">
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_1.4fr] sm:items-end">
                    <div>
                      <span className={labelClass}>Membership</span>
                      <div
                        className="flex h-[2.125rem] items-center justify-center rounded-md border border-dashed border-earth/25 bg-parchment-muted/50 tabular-nums text-sm font-semibold text-earth/45"
                        aria-readonly="true"
                      >
                        £{fee.toFixed(2)}
                      </div>
                    </div>
                    <span
                      className="hidden pb-2 text-center text-gold-dim sm:block"
                      aria-hidden
                    >
                      +
                    </span>
                    <label className="min-w-0">
                      <span className={labelClass}>
                        Donation (£) <span className="text-red-900">*</span>
                      </span>
                      <input
                        required
                        name="donationAmountGbp"
                        inputMode="decimal"
                        autoComplete="off"
                        value={donationExtraGbp}
                        onChange={(ev) => setDonationExtraGbp(ev.target.value)}
                        className={`${inputClass} tabular-nums`}
                        placeholder={`+£ on top of ${fee}`}
                      />
                    </label>
                  </div>
                  {comboTotal !== null && extraParsed !== null ? (
                    <p className="text-xs tabular-nums text-earth">
                      <span className="font-semibold text-deep">Total</span>{" "}
                      <span className="text-gold-dim">£{comboTotal.toFixed(2)}</span>
                      <span className="text-earth/70">
                        {" "}
                        (£{fee.toFixed(2)} + £{extraParsed.toFixed(2)})
                      </span>
                    </p>
                  ) : (
                    <p className="text-[0.7rem] text-earth/70">
                      Donation on top of membership is required.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-4 min-w-0 space-y-3 border-t border-gold/10 pt-4 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:pl-10">
              <div className="space-y-2 rounded-md border border-earth/15 bg-parchment-muted/40 px-3 py-2.5 text-sm text-earth">
                <p>
                  <span className={labelClass}>Today&apos;s date (London)</span>
                  <span className="mt-1 block font-medium leading-snug text-deep">
                    {formatLondonDateLong()}
                  </span>
                </p>
                <p className="border-t border-gold/10 pt-2">
                  <span className={labelClass}>Membership year</span>
                  <span className="mt-1 block tabular-nums text-lg font-semibold text-earth/70">
                    {londonCalendarYear()}
                  </span>
                  <span className="mt-0.5 block text-[0.65rem] leading-snug text-earth/65">
                    UK calendar year for today (Europe/London).
                  </span>
                </p>
              </div>
              <label className="block min-w-0">
                <span className={labelClass}>Note (optional)</span>
                <textarea
                  name="message"
                  value={message}
                  onChange={(ev) => setMessage(ev.target.value)}
                  placeholder="e.g. in memory of…"
                  rows={4}
                  className={`${inputClass} min-h-[5.5rem] resize-y leading-snug lg:min-h-[7.5rem]`}
                />
              </label>
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-gold/10 pt-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full min-h-[2.5rem] items-center justify-center rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-deep shadow-sm transition hover:bg-saffron disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Saving…" : "Continue to secure payment"}
            </button>
            <p className="text-center text-[0.65rem] leading-snug text-earth/75">
              Then SumUp — guest checkout is fine.
            </p>
          </div>

          {error ? (
            <p
              className="mt-3 rounded-md border border-red-900/20 bg-red-50 px-3 py-2 text-xs font-semibold text-red-950"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
