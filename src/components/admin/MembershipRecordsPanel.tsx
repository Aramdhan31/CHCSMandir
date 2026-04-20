"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  mergeImportedMembershipRecords,
  parseMembershipCsv,
  recordsToCsv,
} from "@/lib/memberships/csv";
import {
  loadMembershipRecords,
  saveMembershipRecords,
} from "@/lib/memberships/localStorageStore";
import {
  DEFAULT_MEMBERSHIP_GBP,
  MEMBER_ENTRY_LABELS,
  PAYMENT_METHOD_LABELS,
  type MemberEntryKind,
  type MembershipRecord,
  type PaymentMethod,
} from "@/lib/memberships/types";

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatPaidOn(iso: string) {
  const t = Date.parse(`${iso}T12:00:00`);
  if (Number.isNaN(t)) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(t);
}

function membershipYearChoices() {
  const current = new Date().getFullYear();
  const out: number[] = [];
  for (let y = current + 1; y >= 2007; y -= 1) out.push(y);
  return out;
}

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

/** Live filter while typing: name/address/etc., multi-word (all words), phone digits */
function recordMatchesQuery(r: MembershipRecord, qRaw: string): boolean {
  const trimmed = qRaw.trim();
  if (!trimmed) return true;

  const hay = [
    r.fullName,
    r.address,
    r.email ?? "",
    r.phone,
    r.notes ?? "",
    String(r.membershipYear),
    PAYMENT_METHOD_LABELS[r.paymentMethod],
    MEMBER_ENTRY_LABELS[r.memberEntryKind],
  ]
    .join(" ")
    .toLowerCase();

  const lower = trimmed.toLowerCase();
  if (hay.includes(lower)) return true;

  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => hay.includes(w))) return true;

  const qDigits = digitsOnly(trimmed);
  if (qDigits.length >= 3) {
    const phoneDigits = digitsOnly(r.phone);
    if (phoneDigits.includes(qDigits)) return true;
  }

  return false;
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}

const emptyForm = {
  memberEntryKind: "new_member" as MemberEntryKind,
  fullName: "",
  address: "",
  email: "",
  phone: "",
  paidOn: todayIsoDate(),
  membershipYear: new Date().getFullYear(),
  paymentMethod: "cash" as PaymentMethod,
  membershipAmountGbp: String(DEFAULT_MEMBERSHIP_GBP),
  donationAmountGbp: "",
  notes: "",
};

const inputClass =
  "mt-2 block w-full min-h-[3rem] rounded-xl border-2 border-earth/25 bg-white px-4 py-3 text-lg text-ink outline-none ring-gold/50 focus:border-gold focus:ring-2";
const labelClass = "block text-lg font-semibold leading-snug text-deep";

function MemberReadOnlyBlock({ r }: { r: MembershipRecord }) {
  const total = r.membershipAmountGbp + r.donationAmountGbp;
  return (
    <div className="grid gap-4 text-base sm:grid-cols-2">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-earth">Name</p>
        <p className="mt-1 font-semibold text-deep">{r.fullName}</p>
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-earth">Phone</p>
        <p className="mt-1 text-deep">{r.phone}</p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-sm font-bold uppercase tracking-wide text-earth">Address</p>
        <p className="mt-1 whitespace-pre-wrap text-deep">{r.address}</p>
      </div>
      {r.email ? (
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-earth">Email</p>
          <p className="mt-1 text-deep">{r.email}</p>
        </div>
      ) : null}
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-earth">New or renewal</p>
        <p className="mt-1 text-deep">{MEMBER_ENTRY_LABELS[r.memberEntryKind]}</p>
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-earth">Date paid</p>
        <p className="mt-1 text-deep">{formatPaidOn(r.paidOn)}</p>
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-earth">Membership year</p>
        <p className="mt-1 text-deep">{r.membershipYear}</p>
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-earth">How paid</p>
        <p className="mt-1 text-deep">{PAYMENT_METHOD_LABELS[r.paymentMethod]}</p>
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-earth">Membership</p>
        <p className="mt-1 text-deep">{formatMoney(r.membershipAmountGbp)}</p>
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-earth">Donation</p>
        <p className="mt-1 text-deep">
          {r.donationAmountGbp > 0 ? formatMoney(r.donationAmountGbp) : "—"}
        </p>
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-earth">Total</p>
        <p className="mt-1 font-bold text-deep">{formatMoney(total)}</p>
      </div>
      {r.notes ? (
        <div className="sm:col-span-2">
          <p className="text-sm font-bold uppercase tracking-wide text-earth">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-deep">{r.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

export function MembershipRecordsPanel({ canEdit }: { canEdit: boolean }) {
  const [hydrated, setHydrated] = useState(false);
  const [records, setRecords] = useState<MembershipRecord[]>([]);
  const [search, setSearch] = useState("");
  const [expandedViewId, setExpandedViewId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  useEffect(() => {
    setRecords(loadMembershipRecords());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveMembershipRecords(records);
  }, [hydrated, records]);

  useEffect(() => {
    if (!savedNotice) return;
    const t = window.setTimeout(() => setSavedNotice(false), 5000);
    return () => window.clearTimeout(t);
  }, [savedNotice]);

  const yearOptions = useMemo(() => membershipYearChoices(), []);

  const filtered = useMemo(() => {
    return records.filter((r) => recordMatchesQuery(r, search));
  }, [records, search]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setFormError(null);
    setForm({
      ...emptyForm,
      paidOn: todayIsoDate(),
      membershipYear: new Date().getFullYear(),
    });
  }, []);

  const onEdit = useCallback((r: MembershipRecord) => {
    setExpandedViewId(null);
    setEditingId(r.id);
    setFormError(null);
    setForm({
      memberEntryKind: r.memberEntryKind,
      fullName: r.fullName,
      address: r.address,
      email: r.email ?? "",
      phone: r.phone,
      paidOn: r.paidOn,
      membershipYear: r.membershipYear,
      paymentMethod: r.paymentMethod,
      membershipAmountGbp: String(r.membershipAmountGbp),
      donationAmountGbp: r.donationAmountGbp ? String(r.donationAmountGbp) : "",
      notes: r.notes ?? "",
    });
  }, []);

  /** New payment line: same person, new year — renewal is pre-selected; no need to tap Step 1 first. */
  const onRenewFromRow = useCallback((r: MembershipRecord) => {
    setExpandedViewId(null);
    setEditingId(null);
    setFormError(null);
    const y = new Date().getFullYear();
    setForm({
      memberEntryKind: "yearly_renewal",
      fullName: r.fullName,
      address: r.address,
      email: r.email ?? "",
      phone: r.phone,
      paidOn: todayIsoDate(),
      membershipYear: y,
      paymentMethod: r.paymentMethod,
      membershipAmountGbp: String(DEFAULT_MEMBERSHIP_GBP),
      donationAmountGbp: "",
      notes: "",
    });
    requestAnimationFrame(() => {
      document.getElementById("membership-payment-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const parseMoney = (raw: string, fallback: number) => {
    const t = raw.trim();
    if (!t) return fallback;
    const n = Number(t);
    return Number.isFinite(n) ? n : fallback;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const membershipAmountGbp = parseMoney(form.membershipAmountGbp, DEFAULT_MEMBERSHIP_GBP);
    const donationAmountGbp = Math.max(0, parseMoney(form.donationAmountGbp, 0));
    const emailTrim = form.email.trim();
    const now = new Date().toISOString();

    if (!form.fullName.trim() || !form.address.trim() || !form.phone.trim()) {
      setFormError("Please fill in their name, address, and phone number.");
      return;
    }
    if (!Number.isFinite(form.membershipYear) || form.membershipYear < 1959 || form.membershipYear > 2100) {
      setFormError("Please pick which year this membership is for.");
      return;
    }
    if (membershipAmountGbp < 0) {
      setFormError("The membership amount cannot be less than zero.");
      return;
    }

    setRecords((prev) => {
      const existing = editingId ? prev.find((x) => x.id === editingId) : undefined;
      const row: MembershipRecord = {
        id: editingId ?? newId(),
        fullName: form.fullName.trim(),
        address: form.address.trim(),
        email: emailTrim ? emailTrim : null,
        phone: form.phone.trim(),
        paidOn: form.paidOn,
        membershipYear: form.membershipYear,
        memberEntryKind: form.memberEntryKind,
        paymentMethod: form.paymentMethod,
        membershipAmountGbp,
        donationAmountGbp,
        notes: form.notes.trim() ? form.notes.trim() : null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      const without = prev.filter((x) => x.id !== row.id);
      return [row, ...without].sort((a, b) => b.paidOn.localeCompare(a.paidOn));
    });
    resetForm();
    setSavedNotice(true);
  };

  const onDelete = (id: string, name: string) => {
    const ok = window.confirm(
      `Remove the line for "${name}" from this computer only?\n\nOnly press OK if this was a mistake. You cannot undo this here.`,
    );
    if (!ok) return;
    setRecords((prev) => prev.filter((x) => x.id !== id));
    if (editingId === id) resetForm();
  };

  const onExport = () => {
    const csv = recordsToCsv(records);
    const stamp = todayIsoDate();
    downloadText(`chcs-memberships-${stamp}.csv`, csv);
  };

  const onImportFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const inputEl = e.currentTarget;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { records: incoming, errors, skippedRows } = parseMembershipCsv(text);
      if (incoming.length === 0 && errors.length > 0) {
        setImportFeedback(
          `Nothing was imported. ${errors.map((err) => `Line ${err.line}: ${err.message}`).join(" ")}`,
        );
        inputEl.value = "";
        return;
      }
      setRecords((prev) => mergeImportedMembershipRecords(prev, incoming));
      const errMsg =
        errors.length > 0
          ? ` Some rows were skipped: ${errors.map((er) => `line ${er.line} (${er.message})`).join("; ")}.`
          : "";
      setImportFeedback(
        `Imported ${incoming.length} line(s).${skippedRows > 0 ? ` ${skippedRows} empty row(s) ignored.` : ""}${errMsg}`,
      );
      setSavedNotice(true);
      inputEl.value = "";
    };
    reader.onerror = () => {
      setImportFeedback("Could not read that file. Try exporting from Excel or Google Sheets as CSV again.");
      inputEl.value = "";
    };
    reader.readAsText(file);
  };

  const kindChoice = (kind: MemberEntryKind, title: string, body: string) => {
    const selected = form.memberEntryKind === kind;
    return (
      <button
        type="button"
        onClick={() => setForm((f) => ({ ...f, memberEntryKind: kind }))}
        className={`rounded-2xl border-2 p-5 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${
          selected
            ? "border-gold bg-amber-50/90 shadow-md ring-2 ring-gold/40"
            : "border-earth/20 bg-white hover:border-gold/50"
        }`}
      >
        <span className="font-display text-xl font-bold text-deep">{title}</span>
        <span className="mt-2 block text-base leading-relaxed text-earth">{body}</span>
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10 text-lg leading-relaxed text-earth">
      {savedNotice ? (
        <p
          className="rounded-2xl border-2 border-green-800/25 bg-green-50 px-5 py-4 text-lg font-medium text-green-950"
          role="status"
        >
          Saved. You can add the next person whenever you are ready.
        </p>
      ) : null}

      {!canEdit ? (
        <div className="rounded-2xl border-2 border-sky-800/25 bg-sky-50 px-5 py-4 text-lg text-sky-950 sm:px-6">
          <p className="font-semibold text-deep">View-only access</p>
          <p className="mt-2">
            You can search the list and open each line for details. To add a payment, correct a line,
            or remove a line, sign out and sign in with the <strong className="text-deep">edit PIN</strong>{" "}
            (not the view PIN).
          </p>
        </div>
      ) : null}

      {canEdit ? (
        <div className="rounded-2xl border-2 border-amber-900/20 bg-amber-50/90 p-5 sm:p-6">
          <p className="text-xl font-semibold text-deep">Please read</p>
          <p className="mt-3">
            Membership is <strong className="text-deep">once a year</strong>. Each time someone pays
            (new or returning), add <strong className="text-deep">one line</strong> below. If the
            same person pays again next year, add another line then too — that keeps a clear history.
          </p>
          <p className="mt-3 text-base sm:text-lg">
            This list is saved on <strong className="text-deep">this computer only</strong> until
            online storage is connected. Use <strong className="text-deep">Download spreadsheet</strong>{" "}
            for backups, and <strong className="text-deep">Import spreadsheet</strong> to load a CSV you
            typed up from old paper records (same columns as the download).
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-amber-900/20 bg-amber-50/90 p-5 sm:p-6">
          <p className="text-base sm:text-lg">
            This list is saved on <strong className="text-deep">this computer only</strong> until
            online storage is connected. Use <strong className="text-deep">Download spreadsheet</strong>{" "}
            to keep a copy.
          </p>
        </div>
      )}

      {canEdit ? (
        <div className="rounded-2xl border-2 border-gold/25 bg-white/90 p-5 sm:p-6">
          <p className="text-xl font-semibold text-deep">Paper books → digital</p>
          <p className="mt-3 text-lg">
            Each <strong className="text-deep">row</strong> is one payment for{" "}
            <strong className="text-deep">one membership year</strong> (2007, 2008, …). If someone paid
            every year from 2010–2020, that is <strong className="text-deep">eleven rows</strong>, not one.
          </p>
          <p className="mt-3 text-base sm:text-lg">
            In Excel or Google Sheets, use the same column headings as a fresh{" "}
            <strong className="text-deep">Download spreadsheet</strong> (you can download with an empty list
            to get the header row). Fill in past years, save as <strong className="text-deep">.csv</strong>,
            then <strong className="text-deep">Import spreadsheet</strong> below. Dates as{" "}
            <strong className="text-deep">YYYY-MM-DD</strong> or <strong className="text-deep">DD/MM/YYYY</strong>
            ; payment as <code className="rounded bg-earth/10 px-1.5 py-0.5 text-deep">cash</code>,{" "}
            <code className="rounded bg-earth/10 px-1.5 py-0.5 text-deep">bank_transfer</code>, or{" "}
            <code className="rounded bg-earth/10 px-1.5 py-0.5 text-deep">other</code>.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          onClick={onExport}
          className="min-h-[3rem] rounded-full border-2 border-earth/30 bg-white px-6 text-lg font-semibold text-deep transition hover:border-gold sm:min-w-[14rem]"
        >
          Download spreadsheet
        </button>
        {canEdit ? (
          <>
            <input
              id="membership-csv-import"
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={onImportFile}
            />
            <label
              htmlFor="membership-csv-import"
              className="inline-flex min-h-[3rem] cursor-pointer items-center justify-center rounded-full border-2 border-earth/30 bg-white px-6 text-lg font-semibold text-deep transition hover:border-gold sm:min-w-[14rem]"
            >
              Import spreadsheet
            </label>
          </>
        ) : null}
        <Link
          href="/admin/memberships/logout"
          className="inline-flex min-h-[3rem] items-center justify-center rounded-full border-2 border-earth/30 px-6 text-lg font-semibold text-deep transition hover:border-gold sm:min-w-[14rem]"
        >
          Sign out
        </Link>
      </div>

      {importFeedback ? (
        <p
          className="whitespace-pre-wrap rounded-2xl border-2 border-earth/20 bg-white px-5 py-4 text-base text-deep sm:text-lg"
          role="status"
        >
          {importFeedback}
        </p>
      ) : null}

      {canEdit ? (
      <section
        id="membership-payment-form"
        className="rounded-2xl border-2 border-gold/30 bg-white/95 p-6 shadow-sm sm:p-8"
      >
        <h2 className="font-display text-2xl font-bold text-deep">
          {editingId ? "Change this line" : "Add a payment"}
        </h2>
        {!editingId ? (
          <p className="mt-3 text-lg">
            Yearly membership is normally <strong className="text-deep">£{DEFAULT_MEMBERSHIP_GBP}</strong>.
            If they also gave a donation, put the extra in the donation box (for example £15
            membership and £5 donation).
          </p>
        ) : (
          <p className="mt-3 text-lg">Update the boxes below, then press Save changes.</p>
        )}

        <form className="mt-8 space-y-10" onSubmit={onSubmit}>
          <fieldset className="space-y-4 border-0 p-0">
            <legend className={labelClass}>Step 1 — New member, or renewal?</legend>
            <p className="text-base leading-relaxed text-earth sm:text-lg">
              <strong className="text-deep">Renewals:</strong> tap someone in the list below — their
              details load and <strong className="text-deep">renewal is already chosen</strong> (you do
              not tap Step 1 first). <strong className="text-deep">Brand-new people:</strong> use Step 1
              here, or type from scratch above without using the list.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {kindChoice(
                "yearly_renewal",
                "Renewal (same person, new year)",
                "Pick this if you are not using a row tap — e.g. they renewed but you searched instead of tapping.",
              )}
              {kindChoice(
                "new_member",
                "New member",
                "They have not been entered on this list before. You are typing their details for the first time.",
              )}
            </div>
          </fieldset>

          {formError ? (
            <p className="rounded-xl border-2 border-red-800/30 bg-red-50 px-4 py-3 text-lg text-red-950" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="space-y-8">
            <p className="font-display text-xl font-bold text-deep">Step 2 — Their details</p>

            <label className="block">
              <span className={labelClass}>Full name</span>
              <input
                required
                value={form.fullName}
                onChange={(ev) => setForm((f) => ({ ...f, fullName: ev.target.value }))}
                className={inputClass}
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className={labelClass}>Home address</span>
              <textarea
                required
                rows={4}
                value={form.address}
                onChange={(ev) => setForm((f) => ({ ...f, address: ev.target.value }))}
                className={`${inputClass} min-h-[8rem] resize-y`}
                autoComplete="street-address"
              />
            </label>

            <div className="grid gap-8 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Phone number</span>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(ev) => setForm((f) => ({ ...f, phone: ev.target.value }))}
                  className={inputClass}
                  autoComplete="tel"
                />
              </label>
              <label className="block">
                <span className={labelClass}>Email (optional)</span>
                <span className="mt-1 block text-base text-earth">Leave blank if they do not use email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(ev) => setForm((f) => ({ ...f, email: ev.target.value }))}
                  className={inputClass}
                  autoComplete="email"
                />
              </label>
            </div>
          </div>

          <div className="space-y-8 border-t-2 border-earth/10 pt-10">
            <p className="font-display text-xl font-bold text-deep">Step 3 — Payment</p>

            <div className="grid gap-8 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Date they paid</span>
                <span className="mt-1 block text-base text-earth">Today is filled in — change if needed</span>
                <input
                  required
                  type="date"
                  value={form.paidOn}
                  onChange={(ev) => setForm((f) => ({ ...f, paidOn: ev.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Which year is this membership for?</span>
                <span className="mt-1 block text-base text-earth">Pick the year on their receipt or card</span>
                <select
                  value={form.membershipYear}
                  onChange={(ev) =>
                    setForm((f) => ({ ...f, membershipYear: Number(ev.target.value) }))
                  }
                  className={inputClass}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block sm:max-w-xl">
              <span className={labelClass}>How did they pay?</span>
              <select
                value={form.paymentMethod}
                onChange={(ev) =>
                  setForm((f) => ({ ...f, paymentMethod: ev.target.value as PaymentMethod }))
                }
                className={inputClass}
              >
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((k) => (
                  <option key={k} value={k}>
                    {PAYMENT_METHOD_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-8 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Membership amount (£)</span>
                <span className="mt-1 block text-base text-earth">Usually £{DEFAULT_MEMBERSHIP_GBP}</span>
                <input
                  required
                  inputMode="decimal"
                  value={form.membershipAmountGbp}
                  onChange={(ev) => setForm((f) => ({ ...f, membershipAmountGbp: ev.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Extra donation (£)</span>
                <span className="mt-1 block text-base text-earth">Leave at 0 if they only paid membership</span>
                <input
                  inputMode="decimal"
                  placeholder="0"
                  value={form.donationAmountGbp}
                  onChange={(ev) => setForm((f) => ({ ...f, donationAmountGbp: ev.target.value }))}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Notes (optional)</span>
              <input
                value={form.notes}
                onChange={(ev) => setForm((f) => ({ ...f, notes: ev.target.value }))}
                className={inputClass}
                placeholder="Anything helpful for next year…"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 border-t-2 border-earth/10 pt-8 sm:flex-row sm:flex-wrap">
            <button
              type="submit"
              className="inline-flex min-h-[3.5rem] min-w-[12rem] items-center justify-center rounded-full bg-gold px-10 text-xl font-bold text-deep shadow-sm transition hover:bg-saffron"
            >
              {editingId ? "Save changes" : "Save this payment"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="min-h-[3.5rem] rounded-full border-2 border-earth/30 px-8 text-xl font-semibold text-deep transition hover:border-gold"
              >
                Cancel — do not save
              </button>
            ) : null}
          </div>
        </form>
      </section>
      ) : null}

      <section className="rounded-2xl border-2 border-gold/30 bg-white/95 p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-2xl font-bold text-deep">The list</h2>
        <p className="mt-3 text-lg text-earth">
          {canEdit ? (
            <>
              The table updates <strong className="text-deep">as you type</strong> in the search box.{" "}
              <strong className="text-deep">Tap a row</strong> to record their <strong className="text-deep">renewal</strong>{" "}
              (details fill in; renewal is already selected — go to payment in Step 3). Use{" "}
              <strong className="text-deep">Correct this line</strong> only to fix a mistake on an old
              entry, or <strong className="text-deep">Remove line</strong> to delete it.
            </>
          ) : (
            <>
              Tap a <strong className="text-deep">row</strong> to show full details for that payment.
              The table updates as you type in the search box.
            </>
          )}
        </p>

        <div className="mt-6" role="search">
          <label className="block" htmlFor="membership-search">
            <span className={labelClass}>Search the list</span>
            <span id="membership-search-hint" className="mt-1 block text-base text-earth">
              Name, address, email, notes, year, or phone digits (e.g. 8674)
            </span>
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
            <input
              id="membership-search"
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={search}
              onChange={(ev) => setSearch(ev.target.value)}
              placeholder="Start typing…"
              className={`${inputClass} sm:mt-0 sm:flex-1`}
              aria-describedby="membership-search-hint membership-search-status"
            />
            {search.trim() ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="min-h-[3rem] shrink-0 rounded-xl border-2 border-earth/25 px-5 text-lg font-semibold text-deep transition hover:border-gold sm:px-6"
              >
                Clear
              </button>
            ) : null}
          </div>
          <p
            id="membership-search-status"
            className="mt-3 text-lg text-deep"
            aria-live="polite"
            aria-atomic="true"
          >
            {records.length === 0 ? (
              <>No lines saved yet.</>
            ) : !search.trim() ? (
              <>
                Showing all <strong>{records.length}</strong> line{records.length === 1 ? "" : "s"}.
              </>
            ) : (
              <>
                <strong>{filtered.length}</strong> match{filtered.length === 1 ? "" : "es"} for “
                <span className="break-words">{search.trim()}</span>” (of {records.length}).
              </>
            )}
          </p>
        </div>

        <p className="mt-4 text-base text-earth sm:text-lg">
          On a small screen, slide sideways to see all columns.
        </p>

        <div className="mt-6 overflow-x-auto rounded-xl border border-earth/15">
          <table className="min-w-[52rem] w-full border-collapse text-left text-base sm:text-lg">
            <thead className="bg-parchment-muted/80">
              <tr className="text-deep">
                <th className="px-3 py-4 font-bold sm:px-4">Name</th>
                <th className="px-3 py-4 font-bold sm:px-4">New or renewal</th>
                <th className="px-3 py-4 font-bold sm:px-4">Paid</th>
                <th className="px-3 py-4 font-bold sm:px-4">Year</th>
                <th className="px-3 py-4 font-bold sm:px-4">How paid</th>
                <th className="px-3 py-4 font-bold sm:px-4">Member</th>
                <th className="px-3 py-4 font-bold sm:px-4">Donation</th>
                <th className="px-3 py-4 font-bold sm:px-4">Total</th>
                <th className="px-3 py-4 pl-2 font-bold sm:px-4">
                  {canEdit ? "Actions" : "Details"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-lg text-earth">
                    {records.length === 0
                      ? canEdit
                        ? "Nothing saved yet. Use “Add a payment” above to enter the first one."
                        : "Nothing saved yet."
                      : "No one matches that search. Try fewer letters or clear the box."}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const total = r.membershipAmountGbp + r.donationAmountGbp;
                  const expanded = expandedViewId === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr
                        id={`member-row-${r.id}`}
                        aria-expanded={!canEdit ? expanded : undefined}
                        className="cursor-pointer border-t border-earth/15 align-top scroll-mt-4 hover:bg-amber-50/50"
                        onClick={() => {
                          if (!canEdit) {
                            setExpandedViewId((v) => (v === r.id ? null : r.id));
                          } else {
                            onRenewFromRow(r);
                          }
                        }}
                      >
                        <td className="px-3 py-4 sm:px-4">
                          <div className="font-bold text-deep">{r.fullName}</div>
                          <div className="mt-1 text-base text-earth">{r.phone}</div>
                          {r.email ? <div className="mt-1 text-base text-earth">{r.email}</div> : null}
                        </td>
                        <td className="px-3 py-4 text-earth sm:px-4">
                          {MEMBER_ENTRY_LABELS[r.memberEntryKind]}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-earth sm:px-4">
                          {formatPaidOn(r.paidOn)}
                        </td>
                        <td className="px-3 py-4 font-medium text-deep sm:px-4">{r.membershipYear}</td>
                        <td className="max-w-[10rem] px-3 py-4 text-earth sm:px-4">
                          {PAYMENT_METHOD_LABELS[r.paymentMethod]}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 sm:px-4">
                          {formatMoney(r.membershipAmountGbp)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 sm:px-4">
                          {r.donationAmountGbp > 0 ? formatMoney(r.donationAmountGbp) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 font-bold text-deep sm:px-4">
                          {formatMoney(total)}
                        </td>
                        <td className="px-3 py-3 sm:px-4">
                          {canEdit ? (
                            <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => onEdit(r)}
                                className="min-h-[2.75rem] rounded-lg bg-gold/20 px-4 text-base font-bold text-deep transition hover:bg-gold/35 sm:text-lg"
                              >
                                Correct this line
                              </button>
                              <button
                                type="button"
                                onClick={() => onDelete(r.id, r.fullName)}
                                className="min-h-[2.75rem] rounded-lg border-2 border-red-900/25 px-4 text-base font-bold text-red-950 transition hover:bg-red-50 sm:text-lg"
                              >
                                Remove line
                              </button>
                            </div>
                          ) : (
                            <span className="text-base text-earth">
                              {expanded ? "Details open — tap again to hide" : "Tap row to open"}
                            </span>
                          )}
                        </td>
                      </tr>
                      {!canEdit && expanded ? (
                        <tr className="border-t border-earth/10 bg-parchment-muted/40">
                          <td colSpan={9} className="px-4 py-6 sm:px-6">
                            <MemberReadOnlyBlock r={r} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
