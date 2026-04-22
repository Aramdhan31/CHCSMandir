"use server";

import { cookies } from "next/headers";
import {
  MEMBERSHIPS_ADMIN_COOKIE,
  parseMembershipsRole,
} from "@/lib/memberships/adminCookie";
import type { MemberProfile, MembershipPayment, MembershipRecord } from "@/lib/memberships/types";
import {
  decryptPiiField,
  persistMemberAddress,
  persistMemberEmail,
  persistMemberPhone,
} from "@/lib/memberships/piiCrypto";
import { surnameFromFullName } from "@/lib/memberships/surname";
import { getSupabaseServiceRole } from "@/lib/supabase/service";

const MEMBERS = "membership_members";
const PAYMENTS = "membership_records";

type MemberRow = {
  id: string;
  full_name: string;
  surname: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postcode: string;
  email: string | null;
  phone: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type PaymentRow = {
  id: string;
  member_id: string;
  paid_on: string;
  membership_year: number;
  member_entry_kind: MembershipPayment["memberEntryKind"];
  payment_method: MembershipPayment["paymentMethod"];
  membership_amount_gbp: string;
  donation_amount_gbp: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

async function assertMembershipRead() {
  const jar = await cookies();
  const role = parseMembershipsRole(jar.get(MEMBERSHIPS_ADMIN_COOKIE)?.value);
  if (!role) throw new Error("Not signed in to memberships admin.");
}

async function assertMembershipEdit() {
  const jar = await cookies();
  const role = parseMembershipsRole(jar.get(MEMBERSHIPS_ADMIN_COOKIE)?.value);
  if (role !== "edit") throw new Error("View-only session cannot change records.");
}

/** PostgREST errors when `membership_members` predates postal columns — point operators at the fix migration. */
function throwMembershipSupabaseError(error: { message: string }): never {
  const msg = error.message;
  const lower = msg.toLowerCase();
  const postalMissing =
    lower.includes("address_line1") ||
    lower.includes("address_line2") ||
    (lower.includes("postcode") && lower.includes("does not exist")) ||
    (lower.includes("city") && lower.includes("membership_members") && lower.includes("column"));
  const cacheStale =
    lower.includes("schema cache") && lower.includes("membership_members");
  if (postalMissing || cacheStale) {
    throw new Error(
      `${msg} — Add postal columns: Supabase Dashboard → SQL → run the file supabase/migrations/20260421180000_membership_address_parts.sql from this repo, then reload (wait ~1 min if the API schema cache lags).`,
    );
  }
  throw new Error(msg);
}

function rowToMember(row: MemberRow): MemberProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    surname: row.surname,
    addressLine1: decryptPiiField(row.address_line1),
    addressLine2: decryptPiiField(row.address_line2),
    city: decryptPiiField(row.city),
    postcode: decryptPiiField(row.postcode),
    email: row.email === null ? null : decryptPiiField(row.email),
    phone: decryptPiiField(row.phone),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToPayment(row: PaymentRow): MembershipPayment {
  return {
    id: row.id,
    memberId: row.member_id,
    paidOn: row.paid_on,
    membershipYear: row.membership_year,
    memberEntryKind: row.member_entry_kind,
    paymentMethod: row.payment_method,
    membershipAmountGbp: Number(row.membership_amount_gbp),
    donationAmountGbp: Number(row.donation_amount_gbp),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listMembershipMembersAction(): Promise<MemberProfile[]> {
  await assertMembershipRead();
  const sb = getSupabaseServiceRole();
  if (!sb) return [];

  const { data, error } = await sb
    .from(MEMBERS)
    .select(
      "id,full_name,surname,address_line1,address_line2,city,postcode,email,phone,notes,created_at,updated_at",
    )
    .order("surname", { ascending: true })
    .order("full_name", { ascending: true });

  if (error) throwMembershipSupabaseError(error);
  return ((data as MemberRow[] | null) ?? []).map(rowToMember);
}

export async function listMembershipPaymentsAllAction(): Promise<MembershipPayment[]> {
  await assertMembershipRead();
  const sb = getSupabaseServiceRole();
  if (!sb) return [];

  const { data, error } = await sb
    .from(PAYMENTS)
    .select(
      "id,member_id,paid_on,membership_year,member_entry_kind,payment_method,membership_amount_gbp,donation_amount_gbp,notes,created_at,updated_at",
    )
    .order("paid_on", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data as PaymentRow[] | null) ?? []).map(rowToPayment);
}

export async function listMembershipPaymentsForMemberAction(
  memberId: string,
): Promise<MembershipPayment[]> {
  await assertMembershipRead();
  const sb = getSupabaseServiceRole();
  if (!sb) return [];

  const { data, error } = await sb
    .from(PAYMENTS)
    .select(
      "id,member_id,paid_on,membership_year,member_entry_kind,payment_method,membership_amount_gbp,donation_amount_gbp,notes,created_at,updated_at",
    )
    .eq("member_id", memberId)
    .order("paid_on", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data as PaymentRow[] | null) ?? []).map(rowToPayment);
}

export type NewMemberInput = {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  email: string | null;
  phone: string;
  notes: string | null;
};

export async function createMembershipMemberAction(input: NewMemberInput): Promise<string> {
  await assertMembershipEdit();
  const sb = getSupabaseServiceRole();
  if (!sb) throw new Error("Membership syncing is not configured on the server.");
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from(MEMBERS)
    .insert({
      full_name: input.fullName.trim(),
      address_line1: persistMemberAddress(input.addressLine1),
      address_line2: persistMemberAddress(input.addressLine2),
      city: persistMemberAddress(input.city),
      postcode: persistMemberAddress(input.postcode),
      email: persistMemberEmail(input.email),
      phone: persistMemberPhone(input.phone),
      notes: input.notes?.trim() ? input.notes.trim() : null,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();
  if (error) throwMembershipSupabaseError(error);
  return (data as { id: string }).id;
}

export async function updateMembershipMemberAction(m: MemberProfile): Promise<void> {
  await assertMembershipEdit();
  const sb = getSupabaseServiceRole();
  if (!sb) throw new Error("Membership syncing is not configured on the server.");
  const now = new Date().toISOString();
  const { error } = await sb
    .from(MEMBERS)
    .update({
      full_name: m.fullName.trim(),
      address_line1: persistMemberAddress(m.addressLine1),
      address_line2: persistMemberAddress(m.addressLine2),
      city: persistMemberAddress(m.city),
      postcode: persistMemberAddress(m.postcode),
      email: persistMemberEmail(m.email),
      phone: persistMemberPhone(m.phone),
      notes: m.notes?.trim() ? m.notes.trim() : null,
      updated_at: now,
    })
    .eq("id", m.id);
  if (error) throwMembershipSupabaseError(error);
}

export async function deleteMembershipMemberAction(memberId: string): Promise<void> {
  await assertMembershipEdit();
  const sb = getSupabaseServiceRole();
  if (!sb) throw new Error("Membership syncing is not configured on the server.");
  const { error } = await sb.from(MEMBERS).delete().eq("id", memberId);
  if (error) throwMembershipSupabaseError(error);
}

export async function upsertMembershipPaymentAction(p: MembershipPayment): Promise<void> {
  await assertMembershipEdit();
  const sb = getSupabaseServiceRole();
  if (!sb) throw new Error("Membership syncing is not configured on the server.");
  const row = {
    id: p.id,
    member_id: p.memberId,
    paid_on: p.paidOn,
    membership_year: p.membershipYear,
    member_entry_kind: p.memberEntryKind,
    payment_method: p.paymentMethod,
    membership_amount_gbp: p.membershipAmountGbp,
    donation_amount_gbp: p.donationAmountGbp,
    notes: p.notes,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
  const { error } = await sb.from(PAYMENTS).upsert(row, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export async function deleteMembershipPaymentAction(id: string): Promise<void> {
  await assertMembershipEdit();
  const sb = getSupabaseServiceRole();
  if (!sb) throw new Error("Membership syncing is not configured on the server.");
  const { error } = await sb.from(PAYMENTS).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Joined flat rows for CSV download. */
export async function listMembershipFlatExportAction(): Promise<MembershipRecord[]> {
  await assertMembershipRead();
  const sb = getSupabaseServiceRole();
  if (!sb) return [];

  const { data, error } = await sb.from(PAYMENTS).select(`
    id,
    paid_on,
    membership_year,
    member_entry_kind,
    payment_method,
    membership_amount_gbp,
    donation_amount_gbp,
    notes,
    created_at,
    updated_at,
    member_id,
    membership_members ( full_name, address_line1, address_line2, city, postcode, email, phone )
  `);
  if (error) throwMembershipSupabaseError(error);

  type JoinRow = PaymentRow & {
    membership_members:
      | {
          full_name: string;
          address_line1: string;
          address_line2: string;
          city: string;
          postcode: string;
          email: string | null;
          phone: string;
        }
      | {
          full_name: string;
          address_line1: string;
          address_line2: string;
          city: string;
          postcode: string;
          email: string | null;
          phone: string;
        }[]
      | null;
  };

  const rows = (data as unknown as JoinRow[] | null) ?? [];
  return rows.map((r) => {
    const raw = r.membership_members;
    const mm = Array.isArray(raw) ? raw[0] : raw;
    if (!mm) {
      throw new Error("Payment row missing member join — check foreign key and migration.");
    }
    return {
      id: r.id,
      memberId: r.member_id,
      fullName: mm.full_name,
      addressLine1: decryptPiiField(mm.address_line1),
      addressLine2: decryptPiiField(mm.address_line2),
      city: decryptPiiField(mm.city),
      postcode: decryptPiiField(mm.postcode),
      email: mm.email === null ? null : decryptPiiField(mm.email),
      phone: decryptPiiField(mm.phone),
      paidOn: r.paid_on,
      membershipYear: r.membership_year,
      memberEntryKind: r.member_entry_kind,
      paymentMethod: r.payment_method,
      membershipAmountGbp: Number(r.membership_amount_gbp),
      donationAmountGbp: Number(r.donation_amount_gbp),
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

function digits(phone: string) {
  return phone.replace(/\D/g, "");
}

function findMemberForImportRow(members: MemberProfile[], r: MembershipRecord): MemberProfile | null {
  const d = digits(r.phone);
  if (d.length >= 6) {
    const hit = members.find((m) => digits(m.phone) === d);
    if (hit) return hit;
  }
  const exact = members.find((m) => m.phone.trim() === r.phone.trim());
  if (exact) return exact;
  return members.find(
    (m) => m.fullName.trim().toLowerCase() === r.fullName.trim().toLowerCase() && d.length < 6,
  ) ?? null;
}

/** Import many flat CSV rows (match member by phone / name; upsert payments). */
export async function importMembershipFlatRowsAction(rows: MembershipRecord[]): Promise<void> {
  await assertMembershipEdit();
  const sb = getSupabaseServiceRole();
  if (!sb) throw new Error("Membership syncing is not configured on the server.");
  if (rows.length === 0) return;

  let members = await listMembershipMembersAction();

  for (const r of rows) {
    const now = new Date().toISOString();
    let m = findMemberForImportRow(members, r);
    if (!m) {
      const id = await createMembershipMemberAction({
        fullName: r.fullName,
        addressLine1: r.addressLine1,
        addressLine2: r.addressLine2,
        city: r.city,
        postcode: r.postcode,
        email: r.email,
        phone: r.phone,
        notes: null,
      });
      m = {
        id,
        fullName: r.fullName.trim(),
        surname: surnameFromFullName(r.fullName),
        addressLine1: r.addressLine1.trim(),
        addressLine2: r.addressLine2.trim(),
        city: r.city.trim(),
        postcode: r.postcode.trim(),
        email: r.email,
        phone: r.phone.trim(),
        notes: null,
        createdAt: now,
        updatedAt: now,
      };
      members = [...members, m];
    } else {
      await updateMembershipMemberAction({
        ...m,
        fullName: r.fullName,
        addressLine1: r.addressLine1,
        addressLine2: r.addressLine2,
        city: r.city,
        postcode: r.postcode,
        email: r.email,
        phone: r.phone,
      });
      const mid = m.id;
      const updated: MemberProfile = {
        ...m,
        fullName: r.fullName.trim(),
        addressLine1: r.addressLine1.trim(),
        addressLine2: r.addressLine2.trim(),
        city: r.city.trim(),
        postcode: r.postcode.trim(),
        email: r.email,
        phone: r.phone.trim(),
        surname: surnameFromFullName(r.fullName),
        updatedAt: now,
      };
      members = members.map((x) => (x.id === mid ? updated : x));
      m = updated;
    }

    await upsertMembershipPaymentAction({
      id: r.id,
      memberId: m.id,
      paidOn: r.paidOn,
      membershipYear: r.membershipYear,
      memberEntryKind: r.memberEntryKind,
      paymentMethod: r.paymentMethod,
      membershipAmountGbp: r.membershipAmountGbp,
      donationAmountGbp: r.donationAmountGbp,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }
}
