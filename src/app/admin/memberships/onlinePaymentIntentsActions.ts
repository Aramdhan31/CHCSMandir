"use server";

import { cookies } from "next/headers";
import { getSupabaseServiceRole } from "@/lib/supabase/service";
import {
  MEMBERSHIPS_ADMIN_COOKIE,
  parseMembershipsRole,
} from "@/lib/memberships/adminCookie";

const TABLE = "membership_payment_intents";

export type OnlinePaymentIntent = {
  id: string;
  createdAt: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  kind: "membership" | "donation";
  amountGbp: number | null;
  membershipYear: number | null;
  message: string | null;
  userAgent: string | null;
  sumupUrl: string | null;
};

async function assertMembershipRead() {
  const jar = await cookies();
  const role = parseMembershipsRole(jar.get(MEMBERSHIPS_ADMIN_COOKIE)?.value);
  if (!role) throw new Error("Not signed in to memberships admin.");
}

type IntentRow = {
  id: string;
  created_at: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  kind: "membership" | "donation" | string;
  amount_gbp: number | null;
  membership_year: number | null;
  message: string | null;
  user_agent: string | null;
  sumup_url: string | null;
};

function rowToIntent(r: IntentRow): OnlinePaymentIntent {
  return {
    id: r.id,
    createdAt: r.created_at,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    kind: r.kind === "donation" ? "donation" : "membership",
    amountGbp: typeof r.amount_gbp === "number" ? r.amount_gbp : null,
    membershipYear: typeof r.membership_year === "number" ? r.membership_year : null,
    message: r.message,
    userAgent: r.user_agent,
    sumupUrl: r.sumup_url,
  };
}

export async function listOnlinePaymentIntentsAction(): Promise<OnlinePaymentIntent[]> {
  await assertMembershipRead();
  const sb = getSupabaseServiceRole();
  if (!sb) return [];

  const { data, error } = await sb
    .from(TABLE)
    .select(
      "id,created_at,full_name,email,phone,kind,amount_gbp,membership_year,message,user_agent,sumup_url",
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw new Error(error.message);
  return ((data as IntentRow[] | null) ?? []).map(rowToIntent);
}

