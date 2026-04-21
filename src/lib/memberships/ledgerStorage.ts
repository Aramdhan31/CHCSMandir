"use client";

import type { MemberProfile, MembershipPayment, MembershipRecord } from "./types";
import { emptyPostalAddress } from "./addressFormat";
import { phoneGroupKey, surnameFromFullName } from "./surname";
import { loadMembershipRecords } from "./localStorageStore";

const LEDGER_KEY = "chcs.membershipLedger.v2";

export type MembershipLedger = {
  members: MemberProfile[];
  payments: MembershipPayment[];
};

/** LocalStorage may still hold pre-split `address` string on `MemberProfile`. */
function migrateStoredMemberProfile(m: MemberProfile): MemberProfile {
  const o = m as unknown as Record<string, unknown>;
  if (typeof o.addressLine1 === "string") return m;
  const legacy = typeof o.address === "string" ? o.address.trim() : "";
  const base = emptyPostalAddress();
  return {
    id: m.id,
    fullName: m.fullName,
    surname: m.surname,
    addressLine1: legacy || base.addressLine1,
    addressLine2: base.addressLine2,
    city: base.city,
    postcode: base.postcode,
    email: m.email,
    phone: m.phone,
    notes: m.notes,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

function sortMembers(a: MemberProfile, b: MemberProfile) {
  const s = a.surname.localeCompare(b.surname, "en-GB", { sensitivity: "base" });
  if (s !== 0) return s;
  return a.fullName.localeCompare(b.fullName, "en-GB", { sensitivity: "base" });
}

function sortPaymentsDesc(a: MembershipPayment, b: MembershipPayment) {
  return b.paidOn.localeCompare(a.paidOn) || b.updatedAt.localeCompare(a.updatedAt);
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function migrateFlatToLedger(flat: MembershipRecord[]): MembershipLedger {
  const groupMap = new Map<string, { member: MemberProfile; paymentIds: string[] }>();
  const payments: MembershipPayment[] = [];

  for (const r of flat) {
    const g = phoneGroupKey(r.phone, r.id);
    let bucket = groupMap.get(g);
    if (!bucket) {
      const mid = newId();
      bucket = {
        member: {
          id: mid,
          fullName: r.fullName,
          surname: surnameFromFullName(r.fullName),
          addressLine1: r.addressLine1,
          addressLine2: r.addressLine2,
          city: r.city,
          postcode: r.postcode,
          email: r.email,
          phone: r.phone,
          notes: null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        },
        paymentIds: [],
      };
      groupMap.set(g, bucket);
    }
    const memberId = bucket.member.id;
    const pay: MembershipPayment = {
      id: r.id,
      memberId,
      paidOn: r.paidOn,
      membershipYear: r.membershipYear,
      memberEntryKind: r.memberEntryKind,
      paymentMethod: r.paymentMethod,
      membershipAmountGbp: r.membershipAmountGbp,
      donationAmountGbp: r.donationAmountGbp,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
    payments.push(pay);
    bucket.paymentIds.push(pay.id);
  }

  return {
    members: [...groupMap.values()].map((b) => b.member).sort(sortMembers),
    payments: payments.sort(sortPaymentsDesc),
  };
}

export function loadMembershipLedger(): MembershipLedger {
  if (typeof window === "undefined") return { members: [], payments: [] };
  try {
    const raw = window.localStorage.getItem(LEDGER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as MembershipLedger).members) &&
        Array.isArray((parsed as MembershipLedger).payments)
      ) {
        const L = parsed as MembershipLedger;
        return {
          members: [...L.members].map(migrateStoredMemberProfile).sort(sortMembers),
          payments: [...L.payments].sort(sortPaymentsDesc),
        };
      }
    }
  } catch {
    /* fall through */
  }

  const legacy = loadMembershipRecords();
  if (legacy.length === 0) return { members: [], payments: [] };
  const ledger = migrateFlatToLedger(legacy);
  saveMembershipLedger(ledger);
  try {
    window.localStorage.removeItem("chcs.membershipRecords.v1");
  } catch {
    /* ignore */
  }
  return ledger;
}

export function saveMembershipLedger(ledger: MembershipLedger) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LEDGER_KEY,
    JSON.stringify({
      members: [...ledger.members].sort(sortMembers),
      payments: [...ledger.payments].sort(sortPaymentsDesc),
    }),
  );
}

/** Merge CSV-imported flat rows into an existing ledger (match by payment id; match/create member by phone). */
export function mergeFlatImportIntoLedger(
  ledger: MembershipLedger,
  imported: MembershipRecord[],
): MembershipLedger {
  const members = new Map(ledger.members.map((m) => [m.id, { ...m }]));
  const paymentsMap = new Map(ledger.payments.map((p) => [p.id, { ...p }]));

  const findMemberId = (phone: string) => {
    const d = phone.replace(/\D/g, "");
    if (d.length >= 6) {
      for (const m of members.values()) {
        if (m.phone.replace(/\D/g, "") === d) return m.id;
      }
    }
    for (const m of members.values()) {
      if (m.phone.trim() === phone.trim()) return m.id;
    }
    return null;
  };

  for (const r of imported) {
    let mid = r.memberId && members.has(r.memberId) ? r.memberId : findMemberId(r.phone);
    const now = new Date().toISOString();
    if (!mid) {
      mid = newId();
      members.set(mid, {
        id: mid,
        fullName: r.fullName,
        surname: surnameFromFullName(r.fullName),
        addressLine1: r.addressLine1,
        addressLine2: r.addressLine2,
        city: r.city,
        postcode: r.postcode,
        email: r.email,
        phone: r.phone,
        notes: null,
        createdAt: r.createdAt || now,
        updatedAt: r.updatedAt || now,
      });
    } else {
      const m = members.get(mid)!;
      m.fullName = r.fullName;
      m.addressLine1 = r.addressLine1;
      m.addressLine2 = r.addressLine2;
      m.city = r.city;
      m.postcode = r.postcode;
      m.email = r.email;
      m.phone = r.phone;
      m.surname = surnameFromFullName(r.fullName);
      m.updatedAt = now;
    }

    const pay: MembershipPayment = {
      id: r.id,
      memberId: mid,
      paidOn: r.paidOn,
      membershipYear: r.membershipYear,
      memberEntryKind: r.memberEntryKind,
      paymentMethod: r.paymentMethod,
      membershipAmountGbp: r.membershipAmountGbp,
      donationAmountGbp: r.donationAmountGbp,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
    paymentsMap.set(pay.id, pay);
  }

  return {
    members: [...members.values()].sort(sortMembers),
    payments: [...paymentsMap.values()].sort(sortPaymentsDesc),
  };
}

/** Flatten ledger for CSV export (same columns as before, including optional memberId). */
export function ledgerToFlatRecords(ledger: MembershipLedger): MembershipRecord[] {
  const memberById = new Map(ledger.members.map((m) => [m.id, m]));
  const out: MembershipRecord[] = [];
  for (const p of ledger.payments) {
    const m = memberById.get(p.memberId);
    if (!m) continue;
    out.push({
      id: p.id,
      memberId: p.memberId,
      fullName: m.fullName,
      addressLine1: m.addressLine1,
      addressLine2: m.addressLine2,
      city: m.city,
      postcode: m.postcode,
      email: m.email,
      phone: m.phone,
      paidOn: p.paidOn,
      membershipYear: p.membershipYear,
      memberEntryKind: p.memberEntryKind,
      paymentMethod: p.paymentMethod,
      membershipAmountGbp: p.membershipAmountGbp,
      donationAmountGbp: p.donationAmountGbp,
      notes: p.notes,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }
  return out.sort((a, b) => b.paidOn.localeCompare(a.paidOn));
}
