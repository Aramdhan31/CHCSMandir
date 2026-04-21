"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createMembershipMemberAction,
  deleteMembershipMemberAction,
  deleteMembershipPaymentAction,
  importMembershipFlatRowsAction,
  listMembershipFlatExportAction,
  listMembershipMembersAction,
  listMembershipPaymentsAllAction,
  upsertMembershipPaymentAction,
  updateMembershipMemberAction,
} from "@/app/admin/memberships/membershipDataActions";
import { parseMembershipCsv, recordsToCsv } from "@/lib/memberships/csv";
import {
  ledgerToFlatRecords,
  loadMembershipLedger,
  mergeFlatImportIntoLedger,
  saveMembershipLedger,
} from "@/lib/memberships/ledgerStorage";
import {
  DEFAULT_MEMBERSHIP_GBP,
  MEMBER_ENTRY_LABELS,
  PAYMENT_METHOD_LABELS,
  type MemberEntryKind,
  type MemberProfile,
  type MembershipPayment,
  type PaymentMethod,
} from "@/lib/memberships/types";
import { formatPostalAddressLines, postalAddressSearchText } from "@/lib/memberships/addressFormat";
import { displaySurname, surnameFromFullName } from "@/lib/memberships/surname";

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
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
    month: "short",
    year: "numeric",
  }).format(t);
}

function membershipYearChoices() {
  const current = new Date().getFullYear();
  const out: number[] = [];
  for (let y = current + 1; y >= 2007; y -= 1) out.push(y);
  return out;
}

function memberMatchesQuery(m: MemberProfile, qRaw: string): boolean {
  const trimmed = qRaw.trim();
  if (!trimmed) return true;
  const hay = [
    m.fullName,
    m.surname,
    postalAddressSearchText(m),
    m.email ?? "",
    m.phone,
    m.notes ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const lower = trimmed.toLowerCase();
  if (hay.includes(lower)) return true;
  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => hay.includes(w))) return true;
  const qDigits = trimmed.replace(/\D/g, "");
  if (qDigits.length >= 3 && m.phone.replace(/\D/g, "").includes(qDigits)) return true;
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

const inputClass =
  "mt-2 block w-full min-h-[3rem] rounded-xl border-2 border-earth/25 bg-white px-4 py-3 text-lg text-ink outline-none ring-gold/50 focus:border-gold focus:ring-2";
const labelClass = "block text-lg font-semibold leading-snug text-deep";

function latestPaymentTooltip(payments: MembershipPayment[], memberId: string): string {
  const mine = payments.filter((p) => p.memberId === memberId).sort((a, b) => b.paidOn.localeCompare(a.paidOn));
  const p = mine[0];
  if (!p) return "No membership payments recorded yet.";
  return `Latest: year ${p.membershipYear} — ${formatMoney(p.membershipAmountGbp + p.donationAmountGbp)} total — paid ${formatPaidOn(p.paidOn)}`;
}

function latestPaymentOneLine(payments: MembershipPayment[], memberId: string): string {
  const mine = payments.filter((p) => p.memberId === memberId).sort((a, b) => b.paidOn.localeCompare(a.paidOn));
  const p = mine[0];
  if (!p) return "No payments yet";
  return `${p.membershipYear} · ${formatMoney(p.membershipAmountGbp + p.donationAmountGbp)} · ${formatPaidOn(p.paidOn)}`;
}

export function MembershipRecordsPanel({
  canEdit,
  persistToSupabase,
}: {
  canEdit: boolean;
  persistToSupabase: boolean;
}) {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [payments, setPayments] = useState<MembershipPayment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [busy, setBusy] = useState(false);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [payOpen, setPayOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const memberDetailRef = useRef<HTMLDivElement>(null);
  const [payForm, setPayForm] = useState({
    memberEntryKind: "yearly_renewal" as MemberEntryKind,
    paidOn: todayIsoDate(),
    membershipYear: new Date().getFullYear(),
    paymentMethod: "cash" as PaymentMethod,
    membershipAmountGbp: String(DEFAULT_MEMBERSHIP_GBP),
    donationAmountGbp: "",
    notes: "",
  });

  const refreshAll = useCallback(async () => {
    setRemoteError(null);
    try {
      if (persistToSupabase) {
        const [m, p] = await Promise.all([
          listMembershipMembersAction(),
          listMembershipPaymentsAllAction(),
        ]);
        setMembers(m);
        setPayments(p);
      } else {
        const L = loadMembershipLedger();
        setMembers(L.members);
        setPayments(L.payments);
      }
    } catch (e) {
      setRemoteError(e instanceof Error ? e.message : "Could not load data.");
    } finally {
      setHydrated(true);
    }
  }, [persistToSupabase]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!selectedId) return;
    memberDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  useEffect(() => {
    if (!savedNotice) return;
    const t = window.setTimeout(() => setSavedNotice(false), 4000);
    return () => window.clearTimeout(t);
  }, [savedNotice]);

  useEffect(() => {
    if (!hydrated || persistToSupabase) return;
    saveMembershipLedger({ members, payments });
  }, [hydrated, persistToSupabase, members, payments]);

  const selected = useMemo(
    () => (selectedId ? members.find((m) => m.id === selectedId) ?? null : null),
    [members, selectedId],
  );

  const memberPayments = useMemo(() => {
    if (!selectedId) return [];
    return payments
      .filter((p) => p.memberId === selectedId)
      .sort((a, b) => b.paidOn.localeCompare(a.paidOn));
  }, [payments, selectedId]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => memberMatchesQuery(m, search));
  }, [members, search]);

  const parseMoney = (raw: string, fallback: number) => {
    const t = raw.trim();
    if (!t) return fallback;
    const n = Number(t);
    return Number.isFinite(n) ? n : fallback;
  };

  const openAddPayment = (kind: MemberEntryKind) => {
    setPayForm({
      memberEntryKind: kind,
      paidOn: todayIsoDate(),
      membershipYear: new Date().getFullYear(),
      paymentMethod: "cash",
      membershipAmountGbp: String(DEFAULT_MEMBERSHIP_GBP),
      donationAmountGbp: "",
      notes: "",
    });
    setEditingPaymentId(null);
    setPayOpen(true);
    setFormError(null);
  };

  const openEditPayment = (p: MembershipPayment) => {
    setEditingPaymentId(p.id);
    setPayForm({
      memberEntryKind: p.memberEntryKind,
      paidOn: p.paidOn,
      membershipYear: p.membershipYear,
      paymentMethod: p.paymentMethod,
      membershipAmountGbp: String(p.membershipAmountGbp),
      donationAmountGbp: p.donationAmountGbp ? String(p.donationAmountGbp) : "",
      notes: p.notes ?? "",
    });
    setPayOpen(true);
    setFormError(null);
  };

  const savePayment = async () => {
    if (!selected || !canEdit) return;
    const membershipAmountGbp = parseMoney(payForm.membershipAmountGbp, DEFAULT_MEMBERSHIP_GBP);
    const donationAmountGbp = Math.max(0, parseMoney(payForm.donationAmountGbp, 0));
    const now = new Date().toISOString();
    if (!Number.isFinite(payForm.membershipYear) || payForm.membershipYear < 1959 || payForm.membershipYear > 2100) {
      setFormError("Pick a valid membership year.");
      return;
    }
    if (membershipAmountGbp < 0) {
      setFormError("Membership amount cannot be negative.");
      return;
    }
    const row: MembershipPayment = {
      id: editingPaymentId ?? newId(),
      memberId: selected.id,
      paidOn: payForm.paidOn,
      membershipYear: payForm.membershipYear,
      memberEntryKind: payForm.memberEntryKind,
      paymentMethod: payForm.paymentMethod,
      membershipAmountGbp,
      donationAmountGbp,
      notes: payForm.notes.trim() ? payForm.notes.trim() : null,
      createdAt: editingPaymentId ? payments.find((x) => x.id === editingPaymentId)?.createdAt ?? now : now,
      updatedAt: now,
    };
    setBusy(true);
    setFormError(null);
    try {
      if (persistToSupabase) {
        await upsertMembershipPaymentAction(row);
        await refreshAll();
      } else {
        setPayments((prev) => {
          const rest = prev.filter((x) => x.id !== row.id);
          return [row, ...rest].sort((a, b) => b.paidOn.localeCompare(a.paidOn));
        });
      }
      setPayOpen(false);
      setSavedNotice(true);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save payment.");
    } finally {
      setBusy(false);
    }
  };

  const saveMemberContact = async (patch: MemberProfile) => {
    setBusy(true);
    setFormError(null);
    try {
      if (persistToSupabase) {
        await updateMembershipMemberAction(patch);
        await refreshAll();
      } else {
        setMembers((prev) => prev.map((m) => (m.id === patch.id ? patch : m)));
      }
      setSavedNotice(true);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save contact.");
    } finally {
      setBusy(false);
    }
  };

  const submitNewMember = async () => {
    if (!newMember.fullName.trim() || !newMember.phone.trim()) {
      setFormError("Name and phone are required.");
      return;
    }
    if (!newMember.addressLine1.trim() || !newMember.city.trim() || !newMember.postcode.trim()) {
      setFormError("Street (line 1), city, and postcode are required.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      if (persistToSupabase) {
        const id = await createMembershipMemberAction({
          fullName: newMember.fullName,
          addressLine1: newMember.addressLine1,
          addressLine2: newMember.addressLine2,
          city: newMember.city,
          postcode: newMember.postcode,
          email: newMember.email.trim() ? newMember.email.trim() : null,
          phone: newMember.phone,
          notes: newMember.notes.trim() ? newMember.notes.trim() : null,
        });
        await refreshAll();
        setSelectedId(id);
      } else {
        const now = new Date().toISOString();
        const id = newId();
        const m: MemberProfile = {
          id,
          fullName: newMember.fullName.trim(),
          surname: surnameFromFullName(newMember.fullName),
          addressLine1: newMember.addressLine1.trim(),
          addressLine2: newMember.addressLine2.trim(),
          city: newMember.city.trim(),
          postcode: newMember.postcode.trim(),
          email: newMember.email.trim() ? newMember.email.trim() : null,
          phone: newMember.phone.trim(),
          notes: newMember.notes.trim() ? newMember.notes.trim() : null,
          createdAt: now,
          updatedAt: now,
        };
        setMembers((prev) =>
          [...prev, m].sort((a, b) => a.surname.localeCompare(b.surname, "en-GB", { sensitivity: "base" })),
        );
        setSelectedId(id);
      }
      setAddMemberOpen(false);
      setNewMember({
        fullName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        postcode: "",
        email: "",
        phone: "",
        notes: "",
      });
      setSavedNotice(true);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not add member.");
    } finally {
      setBusy(false);
    }
  };

  const onDeletePayment = async (id: string) => {
    if (!canEdit) return;
    if (!window.confirm("Remove this payment line?")) return;
    setBusy(true);
    try {
      if (persistToSupabase) {
        await deleteMembershipPaymentAction(id);
        await refreshAll();
      } else {
        setPayments((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  };

  const onDeleteMember = async () => {
    if (!canEdit || !selected) return;
    if (!window.confirm(`Remove ${selected.fullName} and all their payment history?`)) return;
    setBusy(true);
    try {
      if (persistToSupabase) {
        await deleteMembershipMemberAction(selected.id);
        setSelectedId(null);
        await refreshAll();
      } else {
        setPayments((prev) => prev.filter((p) => p.memberId !== selected.id));
        setMembers((prev) => prev.filter((m) => m.id !== selected.id));
        setSelectedId(null);
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not delete member.");
    } finally {
      setBusy(false);
    }
  };

  const onExport = async () => {
    setBusy(true);
    try {
      const flat = persistToSupabase
        ? await listMembershipFlatExportAction()
        : ledgerToFlatRecords({ members, payments });
      const csv = recordsToCsv(flat);
      downloadText(`chcs-memberships-${todayIsoDate()}.csv`, csv);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  const onImportFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const inputEl = e.currentTarget;
    const reader = new FileReader();
    reader.onload = () => {
      void (async () => {
        const text = String(reader.result ?? "");
        const { records: incoming, errors, skippedRows } = parseMembershipCsv(text);
        if (incoming.length === 0 && errors.length > 0) {
          setImportFeedback(errors.map((err) => `Line ${err.line}: ${err.message}`).join(" "));
          inputEl.value = "";
          return;
        }
        setBusy(true);
        setImportFeedback(null);
        try {
          if (persistToSupabase) {
            await importMembershipFlatRowsAction(incoming);
            await refreshAll();
          } else {
            const L = mergeFlatImportIntoLedger({ members, payments }, incoming);
            setMembers(L.members);
            setPayments(L.payments);
          }
          setImportFeedback(
            `Imported ${incoming.length} row(s).${skippedRows > 0 ? ` ${skippedRows} empty row(s) ignored.` : ""}${
              errors.length ? ` Some rows skipped: ${errors.map((x) => x.message).join("; ")}` : ""
            }`,
          );
        } catch (err) {
          setImportFeedback(err instanceof Error ? err.message : "Import failed.");
        } finally {
          setBusy(false);
          inputEl.value = "";
        }
      })();
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 text-lg leading-relaxed text-earth">
      {!persistToSupabase ? (
        <div
          className="rounded-2xl border-2 border-amber-800/40 bg-amber-100/90 px-5 py-4 text-base text-amber-950 sm:px-6 sm:text-lg"
          role="status"
        >
          <p className="font-display text-lg font-bold text-deep sm:text-xl">Not saving to Supabase yet</p>
          <p className="mt-2 leading-relaxed">
            Members and payments stay in <strong className="text-deep">this browser only</strong> until you set{" "}
            <code className="text-sm">SUPABASE_SERVICE_ROLE_KEY</code> and restart the dev server.
          </p>
        </div>
      ) : null}

      {savedNotice ? (
        <p
          className="rounded-2xl border-2 border-green-800/25 bg-green-50 px-5 py-4 text-lg font-medium text-green-950"
          role="status"
        >
          Saved.
        </p>
      ) : null}

      {remoteError ? (
        <p className="rounded-2xl border-2 border-red-900/25 bg-red-50 px-5 py-4 font-medium text-red-950" role="alert">
          {remoteError}
        </p>
      ) : null}

      {!canEdit ? (
        <div className="rounded-2xl border-2 border-sky-800/25 bg-sky-50 px-5 py-4 text-lg text-sky-950 sm:px-6">
          <p className="font-semibold text-deep">View-only</p>
          <p className="mt-2">Search and open a member to read their details and payment history.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {canEdit ? (
          <button
            type="button"
            onClick={() => {
              setAddMemberOpen(true);
              setFormError(null);
            }}
            className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full bg-gold px-6 text-lg font-bold text-deep transition hover:bg-saffron"
          >
            Add member
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void onExport()}
          className="min-h-[3.25rem] rounded-full border-2 border-earth/30 bg-white px-6 text-lg font-semibold text-deep transition hover:border-gold disabled:opacity-50"
        >
          Download spreadsheet
        </button>
        {canEdit ? (
          <>
            <span className="sr-only">
              <input
                id="membership-csv-import"
                type="file"
                accept=".csv,text/csv"
                aria-label="Choose membership CSV file to import"
                onChange={onImportFile}
              />
            </span>
            <label
              htmlFor="membership-csv-import"
              className="inline-flex min-h-[3.25rem] cursor-pointer items-center justify-center rounded-full border-2 border-earth/30 bg-white px-6 text-lg font-semibold text-deep transition hover:border-gold"
            >
              Import spreadsheet
            </label>
          </>
        ) : null}
        <Link
          href="/admin/logout"
          className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full border-2 border-earth/30 px-6 text-lg font-semibold text-deep transition hover:border-gold"
        >
          Sign out
        </Link>
      </div>

      {importFeedback ? (
        <p className="whitespace-pre-wrap rounded-2xl border-2 border-earth/20 bg-white px-5 py-4 text-base text-deep">
          {importFeedback}
        </p>
      ) : null}

      {addMemberOpen ? (
        <div className="rounded-2xl border-2 border-gold/30 bg-white/95 p-6 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-deep">New member — contact only</h2>
          <p className="mt-2 text-base text-earth">
            Save their details first. Then open them in the list below to add yearly payments.
          </p>
          {formError ? (
            <p className="mt-4 rounded-xl border-2 border-red-800/30 bg-red-50 px-4 py-3 text-red-950">{formError}</p>
          ) : null}
          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className={labelClass}>Full name</span>
              <input
                className={inputClass}
                value={newMember.fullName}
                onChange={(ev) => setNewMember((n) => ({ ...n, fullName: ev.target.value }))}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Phone</span>
              <input
                type="tel"
                className={inputClass}
                value={newMember.phone}
                onChange={(ev) => setNewMember((n) => ({ ...n, phone: ev.target.value }))}
              />
            </label>
            <fieldset className="rounded-xl border border-earth/15 p-4">
              <legend className="px-1 font-display text-lg font-bold text-deep">Postal address</legend>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Street / building (line 1)</span>
                  <input
                    className={inputClass}
                    value={newMember.addressLine1}
                    onChange={(ev) => setNewMember((n) => ({ ...n, addressLine1: ev.target.value }))}
                    placeholder="e.g. 16 Ostade Road"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Line 2 (optional)</span>
                  <input
                    className={inputClass}
                    value={newMember.addressLine2}
                    onChange={(ev) => setNewMember((n) => ({ ...n, addressLine2: ev.target.value }))}
                    placeholder="Flat, unit, or area"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>City or town</span>
                  <input
                    className={inputClass}
                    value={newMember.city}
                    onChange={(ev) => setNewMember((n) => ({ ...n, city: ev.target.value }))}
                    placeholder="e.g. London"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Postcode</span>
                  <input
                    className={inputClass}
                    value={newMember.postcode}
                    onChange={(ev) => setNewMember((n) => ({ ...n, postcode: ev.target.value }))}
                    placeholder="e.g. SW2 2BB"
                    autoCapitalize="characters"
                  />
                </label>
              </div>
            </fieldset>
            <label className="block">
              <span className={labelClass}>Email (optional)</span>
              <input
                className={inputClass}
                value={newMember.email}
                onChange={(ev) => setNewMember((n) => ({ ...n, email: ev.target.value }))}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Notes (optional)</span>
              <input
                className={inputClass}
                value={newMember.notes}
                onChange={(ev) => setNewMember((n) => ({ ...n, notes: ev.target.value }))}
              />
            </label>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void submitNewMember()}
              className="rounded-full bg-gold px-8 py-3 text-lg font-bold text-deep disabled:opacity-50"
            >
              Save member
            </button>
            <button
              type="button"
              onClick={() => {
                setAddMemberOpen(false);
                setFormError(null);
              }}
              className="rounded-full border-2 border-earth/30 px-8 py-3 text-lg font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border-2 border-gold/30 bg-white/95 p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-2xl font-bold text-deep">Members</h2>
        <p className="mt-2 text-base text-earth sm:text-lg">
          Sorted A–Z by <strong className="text-deep">surname</strong>. The list only shows name + latest payment —
          <strong className="text-deep"> phone, postal address, and email</strong> appear after you{" "}
          <strong className="text-deep">open</strong> someone. You can still search by phone or postcode; those
          matches won’t show those fields until you tap the row.
        </p>

        <div className="mt-5" role="search">
          <label className={labelClass} htmlFor="mem-search">
            Search
          </label>
          <input
            id="mem-search"
            type="search"
            value={search}
            onChange={(ev) => setSearch(ev.target.value)}
            placeholder="Search by name (list), phone, postcode, or street (hidden until open)…"
            className={inputClass}
          />
        </div>

        <ul className="mt-5 divide-y divide-earth/10 rounded-xl border border-earth/15">
          {filteredMembers.length === 0 ? (
            <li className="px-4 py-8 text-center text-earth">No members match.</li>
          ) : (
            filteredMembers.map((m) => {
              const active = selectedId === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    title={latestPaymentTooltip(payments, m.id)}
                    onClick={() => setSelectedId(active ? null : m.id)}
                    className={`w-full px-4 py-4 text-left transition ${
                      active ? "bg-amber-50/90" : "hover:bg-parchment-muted/50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-gold-dim">Surname · A–Z</p>
                      <p className="truncate font-display text-xl font-semibold text-deep">
                        {m.surname.trim() ? displaySurname(m.surname) : "—"}
                      </p>
                      <p className="truncate text-base text-earth">{m.fullName}</p>
                      <p className="mt-1 truncate text-xs text-earth/75">{latestPaymentOneLine(payments, m.id)}</p>
                      <p className="mt-2 text-xs font-medium text-gold-dim">
                        {active ? "Open — tap again to close" : "Tap for contact & payment history"}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {selected ? (
        <section
          ref={memberDetailRef}
          className="space-y-6 rounded-2xl border-2 border-gold/25 bg-white/95 p-6 shadow-sm"
          aria-label="Selected member"
        >
          {canEdit ? null : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-display text-2xl font-bold text-deep">{selected.fullName}</h2>
            </div>
          )}

          <MemberContactBlock
            key={selected.id}
            member={selected}
            canEdit={canEdit}
            busy={busy}
            onSave={(patch) => void saveMemberContact(patch)}
          />

          {canEdit ? (
            <div className="flex flex-wrap justify-end gap-3 border-t border-earth/10 pt-4">
              <button
                type="button"
                onClick={() => void onDeleteMember()}
                className="rounded-full border border-red-900/30 bg-red-50 px-4 py-2 text-sm font-semibold text-red-950"
              >
                Remove member
              </button>
            </div>
          ) : null}

          <div>
            <h3 className="font-display text-xl font-semibold text-deep">Membership history</h3>
            {canEdit ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openAddPayment("new_member")}
                  className="rounded-full border-2 border-gold/50 px-4 py-2 text-sm font-semibold text-deep"
                >
                  Add first / new membership payment
                </button>
                <button
                  type="button"
                  onClick={() => openAddPayment("yearly_renewal")}
                  className="rounded-full border-2 border-earth/25 px-4 py-2 text-sm font-semibold text-deep"
                >
                  Add renewal payment
                </button>
              </div>
            ) : null}

            {memberPayments.length === 0 ? (
              <p className="mt-4 text-earth">No payments yet for this member.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {memberPayments.map((p) => (
                  <li key={p.id} className="rounded-xl border border-earth/15 bg-parchment-muted/30 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gold-dim">
                          {p.membershipYear} · {MEMBER_ENTRY_LABELS[p.memberEntryKind]}
                        </p>
                        <p className="text-deep">{formatPaidOn(p.paidOn)} — {PAYMENT_METHOD_LABELS[p.paymentMethod]}</p>
                        <p className="text-sm text-earth">
                          Membership {formatMoney(p.membershipAmountGbp)}
                          {p.donationAmountGbp > 0 ? ` · Donation ${formatMoney(p.donationAmountGbp)}` : ""}
                        </p>
                        {p.notes ? <p className="mt-1 text-sm text-earth">{p.notes}</p> : null}
                      </div>
                      {canEdit ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditPayment(p)}
                            className="text-sm font-semibold text-gold-dim underline"
                          >
                            Edit payment
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDeletePayment(p.id)}
                            className="text-sm font-semibold text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {payOpen && canEdit ? (
            <div className="rounded-xl border-2 border-gold/30 bg-white p-5">
              <h4 className="font-display text-lg font-bold text-deep">
                {editingPaymentId ? "Edit payment" : "Add payment"}
              </h4>
              {formError ? <p className="mt-2 text-sm text-red-900">{formError}</p> : null}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Type</span>
                  <select
                    className={inputClass}
                    value={payForm.memberEntryKind}
                    onChange={(ev) =>
                      setPayForm((f) => ({ ...f, memberEntryKind: ev.target.value as MemberEntryKind }))
                    }
                  >
                    {(Object.keys(MEMBER_ENTRY_LABELS) as MemberEntryKind[]).map((k) => (
                      <option key={k} value={k}>
                        {MEMBER_ENTRY_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Date paid</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={payForm.paidOn}
                    onChange={(ev) => setPayForm((f) => ({ ...f, paidOn: ev.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Membership year</span>
                  <select
                    className={inputClass}
                    value={payForm.membershipYear}
                    onChange={(ev) => setPayForm((f) => ({ ...f, membershipYear: Number(ev.target.value) }))}
                  >
                    {membershipYearChoices().map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>How paid</span>
                  <select
                    className={inputClass}
                    value={payForm.paymentMethod}
                    onChange={(ev) =>
                      setPayForm((f) => ({ ...f, paymentMethod: ev.target.value as PaymentMethod }))
                    }
                  >
                    {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((k) => (
                      <option key={k} value={k}>
                        {PAYMENT_METHOD_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Membership £</span>
                  <input
                    className={inputClass}
                    value={payForm.membershipAmountGbp}
                    onChange={(ev) => setPayForm((f) => ({ ...f, membershipAmountGbp: ev.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Donation £</span>
                  <input
                    className={inputClass}
                    placeholder="0"
                    value={payForm.donationAmountGbp}
                    onChange={(ev) => setPayForm((f) => ({ ...f, donationAmountGbp: ev.target.value }))}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Notes</span>
                  <input
                    className={inputClass}
                    value={payForm.notes}
                    onChange={(ev) => setPayForm((f) => ({ ...f, notes: ev.target.value }))}
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void savePayment()}
                  className="rounded-full bg-gold px-8 py-3 font-bold text-deep disabled:opacity-50"
                >
                  Save payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayOpen(false);
                    setFormError(null);
                  }}
                  className="rounded-full border-2 border-earth/25 px-8 py-3 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function MemberContactBlock({
  member,
  canEdit,
  busy,
  onSave,
}: {
  member: MemberProfile;
  canEdit: boolean;
  busy: boolean;
  onSave: (m: MemberProfile) => void;
}) {
  const [fullName, setFullName] = useState(member.fullName);
  const [addressLine1, setAddressLine1] = useState(member.addressLine1);
  const [addressLine2, setAddressLine2] = useState(member.addressLine2);
  const [city, setCity] = useState(member.city);
  const [postcode, setPostcode] = useState(member.postcode);
  const [email, setEmail] = useState(member.email ?? "");
  const [phone, setPhone] = useState(member.phone);
  const [notes, setNotes] = useState(member.notes ?? "");

  useEffect(() => {
    setFullName(member.fullName);
    setAddressLine1(member.addressLine1);
    setAddressLine2(member.addressLine2);
    setCity(member.city);
    setPostcode(member.postcode);
    setEmail(member.email ?? "");
    setPhone(member.phone);
    setNotes(member.notes ?? "");
  }, [member]);

  if (!canEdit) {
    const lines = formatPostalAddressLines(member);
    return (
      <div className="grid gap-3 text-base sm:grid-cols-2">
        <p>
          <span className="text-xs font-bold uppercase text-earth">Phone</span>
          <br />
          {member.phone}
        </p>
        <div className="sm:col-span-2">
          <span className="text-xs font-bold uppercase text-earth">Postal address</span>
          <address className="mt-1 not-italic leading-relaxed text-deep">
            {lines.length ? (
              lines.map((line, i) => (
                <span key={`addr-line-${i}`} className="block">
                  {line}
                </span>
              ))
            ) : (
              <span className="text-earth">—</span>
            )}
          </address>
        </div>
        {member.email ? (
          <p>
            <span className="text-xs font-bold uppercase text-earth">Email</span>
            <br />
            {member.email}
          </p>
        ) : null}
        {member.notes ? (
          <p className="sm:col-span-2">
            <span className="text-xs font-bold uppercase text-earth">Notes</span>
            <br />
            {member.notes}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-earth/15 bg-parchment-muted/25 p-4">
      <p className="text-sm font-semibold text-deep">Contact details</p>
      <p className="mt-1 text-sm text-earth/80">Change any field, then tap Save contact. To change a year line, use Edit payment below.</p>
      <div className="mt-3 grid gap-3">
        <label className="block">
          <span className={labelClass}>Full name</span>
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <fieldset className="rounded-xl border border-earth/10 p-4">
          <legend className="px-1 text-base font-bold text-deep">Postal address</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelClass}>Street / building (line 1)</span>
              <input
                className={inputClass}
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="House number and street"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>Line 2 (optional)</span>
              <input
                className={inputClass}
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Flat, unit, or area"
              />
            </label>
            <label className="block">
              <span className={labelClass}>City or town</span>
              <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label className="block">
              <span className={labelClass}>Postcode</span>
              <input
                className={inputClass}
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                autoCapitalize="characters"
              />
            </label>
          </div>
        </fieldset>
        <label className="block">
          <span className={labelClass}>Phone</span>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="block">
          <span className={labelClass}>Email</span>
          <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className={labelClass}>Member notes</span>
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            onSave({
              ...member,
              fullName: fullName.trim(),
              addressLine1: addressLine1.trim(),
              addressLine2: addressLine2.trim(),
              city: city.trim(),
              postcode: postcode.trim(),
              email: email.trim() ? email.trim() : null,
              phone: phone.trim(),
              notes: notes.trim() ? notes.trim() : null,
              surname: surnameFromFullName(fullName),
              updatedAt: new Date().toISOString(),
            })
          }
          className="mt-2 rounded-full bg-gold px-6 py-2.5 font-bold text-deep disabled:opacity-50"
        >
          Save contact
        </button>
      </div>
    </div>
  );
}
