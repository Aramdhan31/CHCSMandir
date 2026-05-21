import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { visit } from "@/content/site";
import type { ContactSubmission } from "@/lib/contact/validate";
import { formatSubmissionCopy } from "@/lib/contact/validate";

type SendResult = { ok: true } | { ok: false; error: string };

function smtpConfig() {
  const user =
    process.env.GMAIL_USER?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "";
  const pass = (
    process.env.GMAIL_APP_PASSWORD?.trim() ||
    process.env.SMTP_PASS?.trim() ||
    ""
  ).replace(/\s/g, "");
  const to = process.env.CONTACT_TO_EMAIL?.trim() || visit.email;
  const fromName = process.env.CONTACT_FROM_NAME?.trim() || "CHCS Mandir";
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT?.trim() || "587");
  const secure = port === 465;

  return { user, pass, to, fromName, host, port, secure };
}

function getTransport(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null {
  const { user, pass, host, port, secure } = smtpConfig();
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendMail(args: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const transport = getTransport();
  const { user, fromName } = smtpConfig();
  if (!transport || !user) {
    return { ok: false, error: "Email is not configured on the server." };
  }

  try {
    await transport.sendMail({
      from: `"${fromName}" <${user}>`,
      to: args.to,
      replyTo: args.replyTo,
      subject: args.subject,
      text: args.text,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export function isContactEmailConfigured() {
  const { user, pass } = smtpConfig();
  return Boolean(user && pass);
}

/** Notify the Mandir Gmail inbox and send the visitor a confirmation copy. */
export async function sendContactEmails(
  data: ContactSubmission,
): Promise<{ ok: true; warning?: string } | { ok: false; error: string }> {
  if (!isContactEmailConfigured()) {
    return {
      ok: false,
      error:
        "Contact email is not configured on the server (set GMAIL_USER and GMAIL_APP_PASSWORD).",
    };
  }

  const { to } = smtpConfig();
  const fullName = `${data.firstName} ${data.lastName}`;
  const templeBody = [
    "New message from the CHCS website contact form.",
    "",
    `Name: ${fullName}`,
    `Email: ${data.email}`,
    `Subject: ${data.subject}`,
    "",
    "Message:",
    data.message,
  ].join("\n");

  const toTemple = await sendMail({
    to,
    subject: `Website enquiry: ${data.subject}`,
    text: templeBody,
    replyTo: data.email,
  });
  if (!toTemple.ok) return toTemple;

  const confirmBody = [
    `Dear ${data.firstName},`,
    "",
    "Thank you for contacting the Caribbean Hindu Cultural Society Mandir.",
    "We have received your message and will reply to this email address when we can.",
    "",
    "— Copy of your enquiry —",
    "",
    formatSubmissionCopy(data),
  ].join("\n");

  const toVisitor = await sendMail({
    to: data.email,
    subject: "We received your message — CHCS Mandir",
    text: confirmBody,
    replyTo: to,
  });
  if (!toVisitor.ok) {
    return {
      ok: true,
      warning: `Your message reached the Mandir, but we could not send a confirmation email (${toVisitor.error}).`,
    };
  }

  return { ok: true };
}
