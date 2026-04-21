/**
 * Membership ledger row — shaped so a future Supabase table can mirror these fields
 * (e.g. one `memberships` table with optional `donation_pence` / `membership_pence`).
 */

export type PaymentMethod = "cash" | "bank_transfer" | "other";

/** First-time details in the book vs paying for another yearly membership */
export type MemberEntryKind = "new_member" | "yearly_renewal";

/** One person in the ledger (contact lives here; payments are separate rows). */
export type MemberProfile = {
  id: string;
  fullName: string;
  /** Lowercased for sorting — last word of full name unless you extend the UI later */
  surname: string;
  /** Street / building (line 1) */
  addressLine1: string;
  /** Flat, unit, district (optional) */
  addressLine2: string;
  city: string;
  postcode: string;
  email: string | null;
  phone: string;
  /** Notes about the person (not a specific payment) */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** One yearly payment line, linked to `MemberProfile`. */
export type MembershipPayment = {
  id: string;
  memberId: string;
  paidOn: string;
  membershipYear: number;
  memberEntryKind: MemberEntryKind;
  paymentMethod: PaymentMethod;
  membershipAmountGbp: number;
  donationAmountGbp: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Flat row for CSV import/export (member + one payment).
 * Legacy imports may omit `memberId` — the importer will match or create a member by phone/name.
 */
export type MembershipRecord = {
  id: string;
  memberId?: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  email: string | null;
  phone: string;
  paidOn: string;
  membershipYear: number;
  memberEntryKind: MemberEntryKind;
  paymentMethod: PaymentMethod;
  membershipAmountGbp: number;
  donationAmountGbp: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_MEMBERSHIP_GBP = 15;

export const MEMBER_ENTRY_LABELS: Record<MemberEntryKind, string> = {
  new_member: "New member",
  yearly_renewal: "Renewal",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash at mandir",
  bank_transfer: "Bank transfer",
  other: "Other",
};
