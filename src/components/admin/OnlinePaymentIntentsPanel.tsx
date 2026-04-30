"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listOnlinePaymentIntentsAction,
  type OnlinePaymentIntent,
} from "@/app/admin/memberships/onlinePaymentIntentsActions";

function formatDateTime(iso: string) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(t));
}

function matchesQuery(row: OnlinePaymentIntent, qRaw: string): boolean {
  const q = qRaw.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    row.fullName,
    row.email,
    row.phone ?? "",
    row.kind,
    row.membershipYear ? String(row.membershipYear) : "",
    row.message ?? "",
  ]
    .join(" ")
    .toLowerCase();
  if (hay.includes(q)) return true;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => hay.includes(w))) return true;
  const digits = q.replace(/\D/g, "");
  if (digits.length >= 3 && (row.phone ?? "").replace(/\D/g, "").includes(digits)) return true;
  return false;
}

export function OnlinePaymentIntentsPanel() {
  const [rows, setRows] = useState<OnlinePaymentIntent[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await listOnlinePaymentIntentsAction();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load online submissions.");
    } finally {
      setHydrated(true);
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => rows.filter((r) => matchesQuery(r, search)), [rows, search]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 text-earth">
      <div className="rounded-2xl border-2 border-gold/30 bg-white/95 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold text-deep">Online memberships</h2>
            <p className="mt-2 text-sm leading-relaxed text-earth">
              These are the details people enter <strong className="text-deep">before</strong> they are sent to SumUp.
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void refresh()}
            className="inline-flex min-h-[3rem] items-center justify-center rounded-full border-2 border-earth/25 bg-white px-5 text-sm font-semibold text-deep transition hover:border-gold disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5" role="search">
          <label className="block text-sm font-semibold text-deep" htmlFor="online-search">
            Search
          </label>
          <input
            id="online-search"
            type="search"
            value={search}
            onChange={(ev) => setSearch(ev.target.value)}
            placeholder="Name, email, phone, year, message…"
            className="mt-2 block w-full rounded-xl border-2 border-earth/25 bg-white px-4 py-2.5 text-ink outline-none ring-gold/50 focus:border-gold focus:ring-2"
          />
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border-2 border-red-900/20 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 overflow-x-auto rounded-xl border border-earth/15 bg-white">
          <table className="min-w-[46rem] w-full text-sm">
            <thead className="bg-parchment-muted/60 text-left text-xs font-bold uppercase tracking-wide text-earth">
              <tr>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">For</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth/10">
              {!hydrated ? (
                <tr>
                  <td className="px-4 py-6 text-earth" colSpan={7}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-earth" colSpan={7}>
                    No matches.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-earth/90">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-deep">{r.fullName}</td>
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.phone ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-950">
                        {r.kind === "donation" ? "Donation" : "Membership"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.membershipYear ?? "—"}</td>
                    <td className="px-4 py-3 text-earth/90">
                      {r.message?.trim() ? r.message : <span className="text-earth/60">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-earth/75">
          Showing {filtered.length} of {rows.length} row(s). New entries appear after refresh.
        </p>
      </div>
    </div>
  );
}

