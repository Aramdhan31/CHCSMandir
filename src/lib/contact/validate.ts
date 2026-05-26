export type ContactSubmission = {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
};

function clean(s: unknown, max: number): string {
  const v = typeof s === "string" ? s.trim() : "";
  if (!v) return "";
  return v.length > max ? v.slice(0, max) : v;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseContactBody(body: unknown): { ok: true; data: ContactSubmission } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request." };
  }
  const o = body as Record<string, unknown>;

  // Honeypot — bots often fill hidden fields
  if (clean(o.company, 200)) {
    return { ok: false, error: "Invalid request." };
  }

  const firstName = clean(o.firstName, 80);
  const lastName = clean(o.lastName, 80);
  const email = clean(o.email, 200);
  const subject = clean(o.subject, 200);
  const message = clean(o.message, 5000);

  if (!firstName || !lastName) return { ok: false, error: "Please enter your name." };
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (!subject) return { ok: false, error: "Please enter a subject." };
  if (!message || message.length < 10) {
    return { ok: false, error: "Please enter a message (at least 10 characters)." };
  }

  return {
    ok: true,
    data: { firstName, lastName, email, subject, message },
  };
}

export function formatSubmissionCopy(data: ContactSubmission, submittedAt?: string) {
  const when = submittedAt ?? new Date().toISOString();
  return [
    "CHCS Temple — enquiry copy",
    `Saved: ${when}`,
    "",
    `Name: ${data.firstName} ${data.lastName}`,
    `Email: ${data.email}`,
    `Subject: ${data.subject}`,
    "",
    "Message:",
    data.message,
    "",
    "---",
    "This is a copy of what you sent on our contact form. The Temple team will reply to your email when they can.",
  ].join("\n");
}
