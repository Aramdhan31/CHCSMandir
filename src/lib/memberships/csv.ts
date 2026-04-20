/**
 * Membership ledger CSV — same columns as “Download spreadsheet” in admin.
 * Use for backup, migration from paper records, or editing in Excel / Google Sheets.
 */

import type { MemberEntryKind, MembershipRecord, PaymentMethod } from "./types";

export const MEMBERSHIP_CSV_COLUMNS = [
  "id",
  "memberEntryKind",
  "fullName",
  "address",
  "email",
  "phone",
  "paidOn",
  "membershipYear",
  "paymentMethod",
  "membershipAmountGbp",
  "donationAmountGbp",
  "totalGbp",
  "notes",
  "createdAt",
  "updatedAt",
] as const;

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function recordsToCsv(rows: MembershipRecord[]) {
  const lines = [MEMBERSHIP_CSV_COLUMNS.join(",")];
  for (const r of rows) {
    const total = r.membershipAmountGbp + r.donationAmountGbp;
    const line = [
      r.id,
      r.memberEntryKind,
      r.fullName,
      r.address,
      r.email ?? "",
      r.phone,
      r.paidOn,
      String(r.membershipYear),
      r.paymentMethod,
      String(r.membershipAmountGbp),
      String(r.donationAmountGbp),
      String(total),
      r.notes ?? "",
      r.createdAt,
      r.updatedAt,
    ].map((c) => escapeCsvCell(String(c)));
    lines.push(line.join(","));
  }
  return lines.join("\r\n");
}

/** RFC4180-style parse: commas, quoted fields, newlines inside quotes. */
export function parseCsvToRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  const str = input.replace(/^\uFEFF/, "");

  for (let i = 0; i < str.length; i++) {
    const c = str[i]!;
    if (inQuotes) {
      if (c === '"' && str[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") {
      cur += c;
    }
  }
  row.push(cur);
  rows.push(row);
  return rows;
}

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

/** Alternate header labels (e.g. “Name” for fullName) — keys are normalized logical names. */
const HEADER_ALIASES: Record<string, string[]> = {
  fullname: ["name"],
  address: ["homeaddress", "postaladdress"],
  memberentrykind: ["kind", "neworrenewal"],
  membershipyear: ["year"],
  paidon: ["datepaid", "date"],
  paymentmethod: ["howpaid"],
  membershipamountgbp: ["fee", "membershipfee"],
  donationamountgbp: ["donation", "extra"],
};

function headerIndex(headerRow: string[], logicalKey: string): number {
  const base = normalizeHeader(logicalKey);
  const candidates = new Set<string>([base, ...(HEADER_ALIASES[base] ?? [])]);
  for (let i = 0; i < headerRow.length; i++) {
    const h = normalizeHeader(headerRow[i] ?? "");
    if (candidates.has(h)) return i;
  }
  return -1;
}

function cell(row: string[], headerRow: string[], key: string): string {
  const ix = headerIndex(headerRow, key);
  if (ix < 0) return "";
  return row[ix] ?? "";
}

function parseMoney(raw: string, fallback: number): number {
  const t = raw.trim().replace(/[£,\s]/g, "");
  if (!t) return fallback;
  const n = Number(t);
  return Number.isFinite(n) ? n : fallback;
}

function parsePaidOn(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12 && y >= 1950 && y <= 2100) {
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }
  return null;
}

function parseMemberEntryKind(raw: string): MemberEntryKind {
  const t = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (t === "new_member" || t === "new" || t === "newmember") return "new_member";
  return "yearly_renewal";
}

function parsePaymentMethod(raw: string): PaymentMethod | null {
  const t = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (t === "cash" || t.includes("mandir")) return "cash";
  if (t === "bank_transfer" || t === "bank" || t.includes("transfer")) return "bank_transfer";
  if (t === "other") return "other";
  return null;
}

export type CsvImportRowError = { line: number; message: string };

export type CsvImportResult = {
  records: MembershipRecord[];
  errors: CsvImportRowError[];
  skippedRows: number;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Parse exported / hand-built CSV into records. One row = one yearly payment (same as the app).
 * Unknown or invalid rows are reported in `errors` and skipped.
 */
export function parseMembershipCsv(
  text: string,
  nowIso = () => new Date().toISOString(),
): CsvImportResult {
  const rows = parseCsvToRows(text);
  const errors: CsvImportRowError[] = [];
  if (rows.length < 2) {
    return {
      records: [],
      errors: [{ line: 1, message: "File is empty or has no data rows under the header." }],
      skippedRows: 0,
    };
  }

  const headerRow = rows[0]!;
  const need = ["fullName", "address", "phone", "paidOn", "membershipYear", "paymentMethod", "membershipAmountGbp"];
  for (const k of need) {
    if (headerIndex(headerRow, k) < 0) {
      return {
        records: [],
        errors: [
          {
            line: 1,
            message: `Missing required column “${k}”. Use the same headers as “Download spreadsheet”, or add that column.`,
          },
        ],
        skippedRows: 0,
      };
    }
  }

  const out: MembershipRecord[] = [];
  let skippedRows = 0;
  const stamp = nowIso();

  for (let r = 1; r < rows.length; r++) {
    const lineNum = r + 1;
    const row = rows[r]!;
    const nonEmpty = row.some((c) => String(c).trim() !== "");
    if (!nonEmpty) {
      skippedRows++;
      continue;
    }

    const fullName = cell(row, headerRow, "fullName").trim();
    const address = cell(row, headerRow, "address").trim();
    const phone = cell(row, headerRow, "phone").trim();
    const paidRaw = cell(row, headerRow, "paidOn");
    const paidOn = parsePaidOn(paidRaw);
    const yearRaw = cell(row, headerRow, "membershipYear").trim();
    const membershipYear = Number(yearRaw);
    const paymentMethod = parsePaymentMethod(cell(row, headerRow, "paymentMethod"));
    const membershipAmountGbp = parseMoney(cell(row, headerRow, "membershipAmountGbp"), NaN);
    const donationRaw = cell(row, headerRow, "donationAmountGbp");
    const donationAmountGbp = donationRaw.trim() === "" ? 0 : parseMoney(donationRaw, 0);

    const idCell = cell(row, headerRow, "id").trim();
    const emailCell = cell(row, headerRow, "email").trim();
    const notesCell = cell(row, headerRow, "notes").trim();
    const mek = cell(row, headerRow, "memberEntryKind");
    const createdAt = cell(row, headerRow, "createdAt").trim();
    const updatedAt = cell(row, headerRow, "updatedAt").trim();

    if (!fullName || !address || !phone) {
      errors.push({ line: lineNum, message: "Missing name, address, or phone." });
      continue;
    }
    if (!paidOn) {
      errors.push({
        line: lineNum,
        message: `Bad date “${paidRaw.trim() || "(empty)"}”. Use YYYY-MM-DD or DD/MM/YYYY.`,
      });
      continue;
    }
    if (!Number.isFinite(membershipYear) || membershipYear < 1959 || membershipYear > 2100) {
      errors.push({ line: lineNum, message: `Bad membership year “${yearRaw}”.` });
      continue;
    }
    if (!paymentMethod) {
      errors.push({
        line: lineNum,
        message: `Unknown payment method. Use cash, bank_transfer, or other.`,
      });
      continue;
    }
    if (!Number.isFinite(membershipAmountGbp) || membershipAmountGbp < 0) {
      errors.push({ line: lineNum, message: "Membership amount must be a number ≥ 0." });
      continue;
    }
    if (donationAmountGbp < 0 || !Number.isFinite(donationAmountGbp)) {
      errors.push({ line: lineNum, message: "Donation amount must be a number ≥ 0." });
      continue;
    }

    const rec: MembershipRecord = {
      id: idCell || newId(),
      fullName,
      address,
      email: emailCell ? emailCell : null,
      phone,
      paidOn,
      membershipYear,
      memberEntryKind: mek.trim() ? parseMemberEntryKind(mek) : "yearly_renewal",
      paymentMethod,
      membershipAmountGbp,
      donationAmountGbp,
      notes: notesCell ? notesCell : null,
      createdAt: createdAt || stamp,
      updatedAt: updatedAt || stamp,
    };
    out.push(rec);
  }

  return { records: out, errors, skippedRows };
}

/** Merge import into existing list: same `id` replaces; then sort by paidOn desc. */
export function mergeImportedMembershipRecords(
  existing: MembershipRecord[],
  imported: MembershipRecord[],
): MembershipRecord[] {
  const map = new Map<string, MembershipRecord>();
  for (const r of existing) map.set(r.id, r);
  for (const r of imported) map.set(r.id, r);
  return [...map.values()].sort(
    (a, b) => b.paidOn.localeCompare(a.paidOn) || b.updatedAt.localeCompare(a.updatedAt),
  );
}
