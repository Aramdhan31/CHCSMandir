"use client";

import { useCallback, useMemo, useState } from "react";
import { visit } from "@/content/site";

export function MembershipPayForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [kind, setKind] = useState<"membership" | "donation">("membership");
  const [membershipYear, setMembershipYear] = useState(() => String(new Date().getFullYear()));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentUrl = visit.membershipPaymentUrl;

  const payload = useMemo(() => {
    return {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      kind,
      membershipYear: membershipYear.trim(),
      message: message.trim(),
    };
  }, [email, fullName, kind, membershipYear, message, phone]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!payload.fullName || !payload.email) {
        setError("Please enter your name and email.");
        return;
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
    [payload, paymentUrl],
  );

  return (
    <form
      onSubmit={onSubmit}
      className="mt-7 space-y-5 rounded-2xl border border-gold/20 bg-white/80 p-6 shadow-sm sm:p-8"
      noValidate
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-base font-semibold text-deep">
          Membership & donation details
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-dim">
          Step 1 of 2
        </p>
      </div>

      <div className="grid gap-5">
        <label className="block text-sm font-medium text-deep">
          <span className="mb-1 block">Full name</span>
          <input
            required
            name="fullName"
            autoComplete="name"
            value={fullName}
            onChange={(ev) => setFullName(ev.target.value)}
            className="w-full rounded-xl border border-earth/25 bg-white px-4 py-2.5 text-ink outline-none ring-gold/50 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-deep">
          <span className="mb-1 block">Email</span>
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="w-full rounded-xl border border-earth/25 bg-white px-4 py-2.5 text-ink outline-none ring-gold/50 focus:ring-2"
          />
        </label>
      </div>

      <div className="grid gap-5">
        <label className="block text-sm font-medium text-deep">
          <span className="mb-1 block">Phone (optional)</span>
          <input
            name="phone"
            autoComplete="tel"
            value={phone}
            onChange={(ev) => setPhone(ev.target.value)}
            className="w-full rounded-xl border border-earth/25 bg-white px-4 py-2.5 text-ink outline-none ring-gold/50 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-deep">
          <span className="mb-1 block">I am paying for</span>
          <select
            name="kind"
            value={kind}
            onChange={(ev) => setKind(ev.target.value === "donation" ? "donation" : "membership")}
            className="w-full rounded-xl border border-earth/25 bg-white px-4 py-2.5 text-ink outline-none ring-gold/50 focus:ring-2"
          >
            <option value="membership">Membership (£15)</option>
            <option value="donation">Donation</option>
          </select>
        </label>
      </div>

      <div className="grid gap-5">
        <label className="block text-sm font-medium text-deep">
          <span className="mb-1 block">Membership year</span>
          <input
            name="membershipYear"
            inputMode="numeric"
            value={membershipYear}
            onChange={(ev) => setMembershipYear(ev.target.value)}
            className="w-full rounded-xl border border-earth/25 bg-white px-4 py-2.5 text-ink outline-none ring-gold/50 focus:ring-2"
          />
          <p className="mt-1 text-xs text-earth/80">
            If you’re donating only, you can leave this as-is.
          </p>
        </label>
        <label className="block text-sm font-medium text-deep">
          <span className="mb-1 block">Note (optional)</span>
          <textarea
            name="message"
            value={message}
            onChange={(ev) => setMessage(ev.target.value)}
            placeholder="e.g. family membership, in memory of…, etc."
            rows={3}
            className="w-full resize-y rounded-xl border border-earth/25 bg-white px-4 py-2.5 text-ink outline-none ring-gold/50 focus:ring-2"
          />
        </label>
      </div>

      <div className="grid gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center rounded-full bg-gold px-8 py-3 text-sm font-semibold text-deep shadow-sm transition hover:bg-saffron disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Saving…" : "Continue to secure payment"}
        </button>
        <p className="text-sm text-earth/85">
          Next: you’ll complete payment on SumUp (guest checkout is normal).
        </p>
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-950/15 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}

