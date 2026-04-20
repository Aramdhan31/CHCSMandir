"use client";

import { useCallback, useState } from "react";
import { visit } from "@/content/site";

const { formLabels, formThankYou, email } = visit;

export function ContactForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showThanks, setShowThanks] = useState(false);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const body = [
        `From: ${firstName} ${lastName}`,
        `Reply-to: ${userEmail}`,
        "",
        message,
      ].join("\n");
      const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      setShowThanks(true);
    },
    [firstName, lastName, userEmail, subject, message],
  );

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-deep">
          <span className="mb-1 block">{formLabels.firstName}</span>
          <input
            required
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            onChange={(ev) => setFirstName(ev.target.value)}
            className="mt-1 w-full rounded-lg border border-earth/20 bg-white px-3 py-2 text-ink outline-none ring-gold/40 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-deep">
          <span className="mb-1 block">{formLabels.lastName}</span>
          <input
            required
            name="lastName"
            autoComplete="family-name"
            value={lastName}
            onChange={(ev) => setLastName(ev.target.value)}
            className="mt-1 w-full rounded-lg border border-earth/20 bg-white px-3 py-2 text-ink outline-none ring-gold/40 focus:ring-2"
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
          value={userEmail}
          onChange={(ev) => setUserEmail(ev.target.value)}
          className="mt-1 w-full rounded-lg border border-earth/20 bg-white px-3 py-2 text-ink outline-none ring-gold/40 focus:ring-2"
        />
      </label>
      <label className="block text-sm font-medium text-deep">
        <span className="mb-1 block">{formLabels.subject}</span>
        <input
          required
          name="subject"
          value={subject}
          onChange={(ev) => setSubject(ev.target.value)}
          className="mt-1 w-full rounded-lg border border-earth/20 bg-white px-3 py-2 text-ink outline-none ring-gold/40 focus:ring-2"
        />
      </label>
      <label className="block text-sm font-medium text-deep">
        <span className="mb-1 block">{formLabels.message}</span>
        <textarea
          required
          name="body"
          rows={5}
          placeholder={formLabels.messagePlaceholder}
          value={message}
          onChange={(ev) => setMessage(ev.target.value)}
          className="mt-1 w-full resize-y rounded-lg border border-earth/20 bg-white px-3 py-2 text-ink outline-none ring-gold/40 focus:ring-2"
        />
      </label>
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-deep transition hover:bg-saffron sm:w-auto"
      >
        {formLabels.submit}
      </button>
      {showThanks ? (
        <p className="text-sm text-earth" role="status">
          {formThankYou}
        </p>
      ) : null}
    </form>
  );
}
