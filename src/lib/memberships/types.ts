/**
 * Membership ledger row — shaped so a future Supabase table can mirror these fields
 * (e.g. one `memberships` table with optional `donation_pence` / `membership_pence`).
 */

export type PaymentMethod = "cash" | "bank_transfer" | "other";

/** First-time details in the book vs paying for another yearly membership */
export type MemberEntryKind = "new_member" | "yearly_renewal";

export type MembershipRecord = {
  id: string;
  /** Member / payer full name */
  fullName: string;
  address: string;
  /** Optional — older members may not use email */
  email: string | null;
  phone: string;
  /** When the payment was received (in person or when transfer cleared) */
  paidOn: string;
  /** Calendar year this yearly membership covers */
  membershipYear: number;
  /** New person vs returning member paying for this year again (each payment is its own row) */
  memberEntryKind: MemberEntryKind;
  paymentMethod: PaymentMethod;
  /** Standard yearly fee is £15; allow overrides if policy changes */
  membershipAmountGbp: number;
  /** Extra voluntary donation, if any */
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
