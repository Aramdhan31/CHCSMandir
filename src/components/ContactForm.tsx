"use client";

import { useCallback, useState } from "react";
import { visit } from "@/content/site";
import { formatSubmissionCopy, type ContactSubmission } from "@/lib/contact/validate";

const {
  formLabels,
  formThankYou,
  formSuccessBody,
  formSaveCopyLabel,
  formCopyLabel,
  formSendAnotherLabel,
} = visit;

const emptyForm = (): ContactSubmission => ({
  firstName: "",
  lastName: "",
  email: "",
  subject: "",
  message: "",
});

export function ContactForm() {
  const [form, setForm] = useState<ContactSubmission>(emptyForm);
  const [company, setCompany] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const sent = submittedAt !== null;
  const copyText = sent
    ? formatSubmissionCopy(form, submittedAt)
    : "";

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setWarning(null);
      setCopyStatus(null);
      setPending(true);
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, company }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          warning?: string;
          submittedAt?: string;
        };
        if (!res.ok || !data.ok) {
          setError(data.error ?? "Could not send your message. Please try again or email us directly.");
          return;
        }
        setSubmittedAt(data.submittedAt ?? new Date().toISOString());
        if (data.warning) setWarning(data.warning);
      } catch {
        setError("Could not send your message. Check your connection or email us directly.");
      } finally {
        setPending(false);
      }
    },
    [form, company],
  );

  const downloadCopy = () => {
    if (!copyText) return;
    const blob = new Blob([copyText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chcs-enquiry-${form.lastName || "message"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyStatus("Copied to clipboard.");
    } catch {
      setCopyStatus("Could not copy — use Download a copy instead.");
    }
  };

  const resetForm = () => {
    setForm(emptyForm());
    setCompany("");
    setSubmittedAt(null);
    setError(null);
    setWarning(null);
    setCopyStatus(null);
  };

  if (sent) {
    return (
      <div className="space-y-5" role="status" aria-live="polite">
        <div className="rounded-xl border border-gold/30 bg-parchment-muted/60 px-4 py-4">
          <p className="font-display text-lg font-semibold text-deep">{formThankYou}</p>
          <p className="mt-2 text-sm leading-relaxed text-earth">{formSuccessBody}</p>
          {warning ? (
            <p className="mt-3 text-sm leading-relaxed text-earth/90">{warning}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={downloadCopy}
            className="inline-flex items-center justify-center rounded-full border-2 border-gold/50 bg-white/80 px-5 py-2.5 text-sm font-semibold text-gold-dim transition hover:border-gold hover:bg-white hover:text-deep"
          >
            {formSaveCopyLabel}
          </button>
          <button
            type="button"
            onClick={() => void copyToClipboard()}
            className="inline-flex items-center justify-center rounded-full border-2 border-gold/35 bg-parchment-muted/80 px-5 py-2.5 text-sm font-semibold text-earth transition hover:border-gold hover:text-deep"
          >
            {formCopyLabel}
          </button>
        </div>
        {copyStatus ? <p className="text-sm text-earth">{copyStatus}</p> : null}

        <button
          type="button"
          onClick={resetForm}
          className="text-sm font-semibold text-gold-dim underline-offset-4 hover:text-deep hover:underline"
        >
          {formSendAnotherLabel}
        </button>
      </div>
    );
  }

  return (
    <form className="relative space-y-4" onSubmit={(e) => void onSubmit(e)} noValidate>
      {/* Honeypot — hidden from people, not from bots */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          Company
          <input
            tabIndex={-1}
            autoComplete="off"
            name="company"
            value={company}
            onChange={(ev) => setCompany(ev.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-deep">
          <span className="mb-1 block">{formLabels.firstName}</span>
          <input
            required
            name="firstName"
            autoComplete="given-name"
            value={form.firstName}
            onChange={(ev) => setForm((f) => ({ ...f, firstName: ev.target.value }))}
            disabled={pending}
            className="mt-1 w-full rounded-lg border border-earth/20 bg-white px-3 py-2 text-ink outline-none ring-gold/40 focus:ring-2 disabled:opacity-60"
          />
        </label>
        <label className="block text-sm font-medium text-deep">
          <span className="mb-1 block">{formLabels.lastName}</span>
          <input
            required
            name="lastName"
            autoComplete="family-name"
            value={form.lastName}
            onChange={(ev) => setForm((f) => ({ ...f, lastName: ev.target.value }))}
            disabled={pending}
            className="mt-1 w-full rounded-lg border border-earth/20 bg-white px-3 py-2 text-ink outline-none ring-gold/40 focus:ring-2 disabled:opacity-60"
          />
        </label>
      </div>
      <label className="block text-sm font-medium text-deep">
        <span className="mb-1 block">{formLabels.email}</span>
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          value={form.email}
          onChange={(ev) => setForm((f) => ({ ...f, email: ev.target.value }))}
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-earth/20 bg-white px-3 py-2 text-ink outline-none ring-gold/40 focus:ring-2 disabled:opacity-60"
        />
      </label>
      <label className="block text-sm font-medium text-deep">
        <span className="mb-1 block">{formLabels.subject}</span>
        <input
          required
          name="subject"
          value={form.subject}
          onChange={(ev) => setForm((f) => ({ ...f, subject: ev.target.value }))}
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-earth/20 bg-white px-3 py-2 text-ink outline-none ring-gold/40 focus:ring-2 disabled:opacity-60"
        />
      </label>
      <label className="block text-sm font-medium text-deep">
        <span className="mb-1 block">{formLabels.message}</span>
        <textarea
          required
          name="body"
          rows={5}
          placeholder={formLabels.messagePlaceholder}
          value={form.message}
          onChange={(ev) => setForm((f) => ({ ...f, message: ev.target.value }))}
          disabled={pending}
          className="mt-1 w-full resize-y rounded-lg border border-earth/20 bg-white px-3 py-2 text-ink outline-none ring-gold/40 focus:ring-2 disabled:opacity-60"
        />
      </label>

      {error ? (
        <p className="rounded-xl border border-red-800/25 bg-red-50 px-4 py-3 text-sm text-red-950" role="alert">
          {error}
          {" "}
          <a href={`mailto:${visit.email}`} className="font-semibold underline">
            {visit.email}
          </a>
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-deep transition hover:bg-saffron disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? formLabels.submitting : formLabels.submit}
      </button>
    </form>
  );
}
