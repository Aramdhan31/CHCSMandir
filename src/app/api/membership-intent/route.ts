import { NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase/service";
import { visit } from "@/content/site";

const TABLE = "membership_payment_intents";

function clean(s: unknown, max = 300) {
  const v = typeof s === "string" ? s.trim() : "";
  if (!v) return "";
  return v.length > max ? v.slice(0, max) : v;
}

function parseYear(raw: unknown) {
  const t = clean(raw, 12);
  if (!t) return null;
  const y = Number(t);
  if (!Number.isFinite(y) || y < 1959 || y > 2100) return null;
  return Math.trunc(y);
}

export async function POST(req: Request) {
  const sb = getSupabaseServiceRole();
  if (!sb) {
    return NextResponse.json(
      { ok: false, error: "Supabase service role is not configured on the server." },
      { status: 501 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const obj = (body ?? {}) as Record<string, unknown>;
  const fullName = clean(obj.fullName, 120);
  const email = clean(obj.email, 200);
  const phone = clean(obj.phone, 60) || null;
  const kindRaw = clean(obj.kind, 20);
  const kind = kindRaw === "donation" ? "donation" : "membership";
  const membershipYear = parseYear(obj.membershipYear);
  const message = clean(obj.message, 600) || null;
  const userAgent = clean(req.headers.get("user-agent") ?? "", 240) || null;
  const sumupUrl = clean(visit.membershipPaymentUrl, 500) || null;

  if (!fullName || !email) {
    return NextResponse.json(
      { ok: false, error: "Missing fullName or email." },
      { status: 400 },
    );
  }

  const row = {
    full_name: fullName,
    email,
    phone,
    kind,
    membership_year: membershipYear,
    message,
    user_agent: userAgent,
    sumup_url: sumupUrl,
  };

  const { data, error } = await sb
    .from(TABLE)
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: (data as { id: string } | null)?.id ?? null });
}

