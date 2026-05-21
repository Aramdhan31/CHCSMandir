import { NextResponse } from "next/server";
import { sendContactEmails } from "@/lib/contact/sendContactEmail";
import { parseContactBody } from "@/lib/contact/validate";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = parseContactBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const sent = await sendContactEmails(parsed.data);
  if (!sent.ok) {
    const status = sent.error.includes("not configured") ? 501 : 502;
    return NextResponse.json({ ok: false, error: sent.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    submittedAt: new Date().toISOString(),
    warning: "warning" in sent ? sent.warning : undefined,
  });
}
