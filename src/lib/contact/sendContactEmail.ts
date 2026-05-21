import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { visit } from "@/content/site";
import type { ContactSubmission } from "@/lib/contact/validate";
import {
  buildTempleEnquiryEmail,
  buildVisitorConfirmationEmail,
} from "@/lib/contact/emailTemplates";

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
  const inbox = process.env.CONTACT_TO_EMAIL?.trim() || visit.email;
  const fromEmail =
    process.env.CONTACT_NOREPLY_EMAIL?.trim() ||
    process.env.CONTACT_FROM_EMAIL?.trim() ||
    user;
  const replyTo =
    process.env.CONTACT_REPLY_TO?.trim() || inbox;
  const fromName = process.env.CONTACT_FROM_NAME?.trim() || "CHCS Temple";
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT?.trim() || "587");
  const secure = port === 465;

  return { user, pass, inbox, fromEmail, replyTo, fromName, host, port, secure };
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
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  const transport = getTransport();
  const { fromEmail, fromName } = smtpConfig();
  if (!transport || !fromEmail) {
    return { ok: false, error: "Email is not configured on the server." };
  }

  try {
    await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: args.to,
      replyTo: args.replyTo,
      subject: args.subject,
      text: args.text,
      html: args.html,
      priority: "normal",
      headers: {
        "X-Mailer": "CHCS Temple Website",
      },
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

/** Notify the Mandir inbox and send the visitor a confirmation copy. */
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

  const { inbox, fromEmail, replyTo } = smtpConfig();
  const temple = buildTempleEnquiryEmail(data);

  const toTemple = await sendMail({
    to: inbox,
    subject: temple.subject,
    text: temple.text,
    html: temple.html,
    replyTo: data.email,
  });
  if (!toTemple.ok) return toTemple;

  const confirm = buildVisitorConfirmationEmail(data, replyTo, fromEmail);

  const toVisitor = await sendMail({
    to: data.email,
    subject: confirm.subject,
    text: confirm.text,
    html: confirm.html,
    replyTo,
  });
  if (!toVisitor.ok) {
    return {
      ok: true,
      warning: `Your message reached the Mandir, but we could not send a confirmation email (${toVisitor.error}).`,
    };
  }

  return { ok: true };
}
