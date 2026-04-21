"use client";

import type {
  MemberEntryKind,
  MembershipRecord,
  PaymentMethod,
} from "./types";
import { emptyPostalAddress } from "./addressFormat";

const STORAGE_KEY = "chcs.membershipRecords.v1";

function sortByPaidOnDesc(a: MembershipRecord, b: MembershipRecord) {
  return b.paidOn.localeCompare(a.paidOn) || b.updatedAt.localeCompare(a.updatedAt);
}

function isPaymentMethod(x: unknown): x is PaymentMethod {
  return x === "cash" || x === "bank_transfer" || x === "other";
}

function normalizeMemberEntryKind(x: unknown): MemberEntryKind {
  return x === "new_member" || x === "yearly_renewal" ? x : "yearly_renewal";
}

/** Accepts older saved rows before `memberEntryKind` existed */
function normalizeMembershipRecord(row: unknown): MembershipRecord | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  if (typeof r.id !== "string") return null;
  if (typeof r.fullName !== "string") return null;
  const legacyAddr = typeof r.address === "string" ? r.address : null;
  const line1 =
    typeof r.addressLine1 === "string"
      ? r.addressLine1
      : legacyAddr !== null
        ? legacyAddr
        : null;
  if (line1 === null) return null;
  if (typeof r.phone !== "string") return null;
  if (typeof r.paidOn !== "string") return null;
  if (typeof r.membershipYear !== "number" || !Number.isFinite(r.membershipYear)) return null;
  if (!isPaymentMethod(r.paymentMethod)) return null;
  if (typeof r.membershipAmountGbp !== "number" || !Number.isFinite(r.membershipAmountGbp)) {
    return null;
  }
  if (typeof r.donationAmountGbp !== "number" || !Number.isFinite(r.donationAmountGbp)) {
    return null;
  }
  if (r.notes !== null && typeof r.notes !== "string") return null;
  if (typeof r.createdAt !== "string") return null;
  if (typeof r.updatedAt !== "string") return null;

  const email =
    r.email == null || r.email === ""
      ? null
      : typeof r.email === "string"
        ? r.email
        : null;
  if (r.email != null && r.email !== "" && typeof r.email !== "string") return null;

  const notes =
    r.notes == null || r.notes === ""
      ? null
      : typeof r.notes === "string"
        ? r.notes
        : null;
  if (r.notes != null && r.notes !== "" && typeof r.notes !== "string") return null;

  const memberId =
    typeof r.memberId === "string" && r.memberId.trim() ? r.memberId.trim() : undefined;

  const blank = emptyPostalAddress();
  const addressLine1 = typeof r.addressLine1 === "string" ? r.addressLine1 : legacyAddr ?? blank.addressLine1;
  const addressLine2 = typeof r.addressLine2 === "string" ? r.addressLine2 : blank.addressLine2;
  const city = typeof r.city === "string" ? r.city : blank.city;
  const postcode = typeof r.postcode === "string" ? r.postcode : blank.postcode;

  return {
    id: r.id,
    memberId,
    fullName: r.fullName,
    addressLine1,
    addressLine2,
    city,
    postcode,
    email,
    phone: r.phone,
    paidOn: r.paidOn,
    membershipYear: r.membershipYear,
    memberEntryKind: normalizeMemberEntryKind(r.memberEntryKind),
    paymentMethod: r.paymentMethod,
    membershipAmountGbp: r.membershipAmountGbp,
    donationAmountGbp: r.donationAmountGbp,
    notes,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function loadMembershipRecords(): MembershipRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeMembershipRecord)
      .filter((row): row is MembershipRecord => row !== null)
      .sort(sortByPaidOnDesc);
  } catch {
    return [];
  }
}

export function saveMembershipRecords(records: MembershipRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}
