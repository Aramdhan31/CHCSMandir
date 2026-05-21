import type { ContactSubmission } from "@/lib/contact/validate";
import { formatSubmissionCopy } from "@/lib/contact/validate";
import { brand, site, visit } from "@/content/site";

const COLORS = {
  parchment: "#faf6ef",
  parchmentMuted: "#e8e0d4",
  gold: "#b8860b",
  deep: "#3a241b",
  earth: "#5c4a3d",
  white: "#ffffff",
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(s: string) {
  return escapeHtml(s).replace(/\r?\n/g, "<br />");
}

function emailShell(title: string, bodyHtml: string, footerHtml: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.parchmentMuted};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.parchmentMuted};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${COLORS.white};border:1px solid ${COLORS.gold};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:${COLORS.deep};padding:20px 24px;">
              <p style="margin:0;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:${COLORS.parchmentMuted};">${escapeHtml(brand.appName)}</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;color:${COLORS.parchment};line-height:1.3;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;color:${COLORS.earth};font-size:16px;line-height:1.55;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;border-top:1px solid ${COLORS.parchmentMuted};font-size:13px;line-height:1.5;color:${COLORS.earth};">
              ${footerHtml}
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:${COLORS.earth};">${escapeHtml(site.nameFull)} · ${escapeHtml(visit.addressLines.join(", "))}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, valueHtml: string) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid ${COLORS.parchmentMuted};vertical-align:top;width:110px;font-size:14px;font-weight:600;color:${COLORS.deep};">${escapeHtml(label)}</td>
    <td style="padding:10px 0 10px 12px;border-bottom:1px solid ${COLORS.parchmentMuted};font-size:15px;color:${COLORS.earth};">${valueHtml}</td>
  </tr>`;
}

export function buildTempleEnquiryEmail(data: ContactSubmission) {
  const fullName = `${data.firstName} ${data.lastName}`;
  const text = [
    `${site.nameFull} — new website enquiry`,
    "",
    `Name:     ${fullName}`,
    `Email:    ${data.email}`,
    `Subject:  ${data.subject}`,
    "",
    "Message:",
    data.message,
    "",
    `Reply directly to ${data.email} to respond.`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;">Someone submitted the contact form on <strong>chcstemple.org</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${detailRow("Name", escapeHtml(fullName))}
      ${detailRow("Email", `<a href="mailto:${escapeHtml(data.email)}" style="color:${COLORS.gold};font-weight:600;">${escapeHtml(data.email)}</a>`)}
      ${detailRow("Subject", escapeHtml(data.subject))}
    </table>
    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${COLORS.deep};">Message</p>
    <div style="background-color:${COLORS.parchment};border-left:4px solid ${COLORS.gold};padding:16px 18px;border-radius:0 8px 8px 0;font-size:15px;line-height:1.6;color:${COLORS.earth};">
      ${nl2br(data.message)}
    </div>
  `;

  const html = emailShell(
    "New website enquiry",
    bodyHtml,
    `<strong>Tip:</strong> hit <strong>Reply</strong> in Gmail — your reply will go to <a href="mailto:${escapeHtml(data.email)}" style="color:${COLORS.gold};">${escapeHtml(data.email)}</a>, not to the automated sender.`,
  );

  return { text, html, subject: `Website enquiry: ${data.subject}` };
}

export function buildVisitorConfirmationEmail(
  data: ContactSubmission,
  replyToEmail: string,
  fromDisplayEmail: string,
) {
  const isNoreply = /noreply|no-reply|donotreply/i.test(fromDisplayEmail);
  const addressLine = visit.addressLines.join(", ");
  const text = [
    `Dear ${data.firstName},`,
    "",
    `Thank you for contacting ${site.nameFull} (${brand.appName}).`,
    "We have received your message and will reply when we can.",
    "",
    formatSubmissionCopy(data),
    "",
    `To reply or follow up, email ${replyToEmail} (not the sender address above).`,
    "",
    "If you do not see future mail from us, check your Junk or Spam folder and mark as Not spam.",
    "",
    `${brand.appName} · ${addressLine} · ${visit.phoneDisplay}`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;">Dear <strong>${escapeHtml(data.firstName)}</strong>,</p>
    <p style="margin:0 0 16px;">Thank you for contacting <strong>${escapeHtml(site.nameFull)}</strong>. We have received your message and will get back to you at <strong>${escapeHtml(data.email)}</strong> when we can.</p>
    <p style="margin:0 0 16px;padding:12px 14px;background-color:${COLORS.parchment};border-radius:8px;font-size:14px;color:${COLORS.earth};">
      <strong>Not in your inbox?</strong> Check <strong>Junk</strong> or <strong>Spam</strong>, open the message, and choose <strong>Not spam</strong> / <strong>Report as not junk</strong> so future emails from us arrive normally.
    </p>
    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${COLORS.deep};">Your enquiry</p>
    <div style="background-color:${COLORS.parchment};border:1px solid ${COLORS.parchmentMuted};padding:16px 18px;border-radius:8px;font-size:14px;line-height:1.55;color:${COLORS.earth};">
      <p style="margin:0 0 8px;"><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
      <p style="margin:0;">${nl2br(data.message)}</p>
    </div>
  `;

  const footer = isNoreply
    ? `This confirmation was sent from <strong>${escapeHtml(fromDisplayEmail)}</strong>. Please <strong>do not reply</strong> to that address — contact us at <a href="mailto:${escapeHtml(replyToEmail)}" style="color:${COLORS.gold};font-weight:600;">${escapeHtml(replyToEmail)}</a>.<br /><br />${escapeHtml(brand.appName)} · ${escapeHtml(addressLine)} · ${escapeHtml(visit.phoneDisplay)}`
    : `Questions? Email <a href="mailto:${escapeHtml(replyToEmail)}" style="color:${COLORS.gold};">${escapeHtml(replyToEmail)}</a>.`;

  const html = emailShell("We received your message", bodyHtml, footer);

  return {
    text,
    html,
    subject: `${brand.appName}: your enquiry was received`,
  };
}
