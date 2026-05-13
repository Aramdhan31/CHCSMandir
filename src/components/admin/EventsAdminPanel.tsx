"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  deleteAdminEventAction,
  listAdminEventsAction,
  listAdminRecurringSettingsAction,
  upsertAdminEventAction,
  upsertAdminRecurringSettingAction,
} from "@/app/admin/events/eventDataActions";
import type { AdminEventItem, AdminRecurringSetting, RecurringEventKind } from "@/lib/events/types";
import { loadAdminEvents, saveAdminEvents } from "@/lib/events/localStorageStore";
import { recurringEventTitles } from "@/content/site";

const RECURRING_DEFAULTS: AdminRecurringSetting[] = [
  {
    kind: "monthly_satsang",
    use_automatic_next: true,
    override_event_date: "",
    override_event_time: "",
    hidden_from_site: false,
  },
  {
    kind: "bhajan_satsang",
    use_automatic_next: true,
    override_event_date: "",
    override_event_time: "",
    hidden_from_site: false,
  },
];

const RECURRING_HELP: Record<
  RecurringEventKind,
  { title: string; description: string }
> = {
  monthly_satsang: {
    title: "Next Monthly Satsang",
    description:
      "Normally the next 1st Sunday at 11:00am (computed automatically). Turn manual control on to set a different next date, or hide the card if this month’s service is cancelled.",
  },
  bhajan_satsang: {
    title: "Next Bhajan Satsang",
    description:
      "Normally the next 2nd Saturday at 3:00pm (computed automatically). Override the date or time when it changes, or hide the card temporarily.",
  },
};

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ev_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(iso: string) {
  const t = Date.parse(`${iso}T12:00:00`);
  if (Number.isNaN(t)) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(t);
}

function formatTime(raw: string | undefined) {
  const t = (raw ?? "").trim();
  if (!t) return "";
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t;
  let h = Number(m[1]);
  const min = m[2];
  if (!Number.isFinite(h)) return t;
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${min}${ampm}`;
}

function normalizeTime(raw: string) {
  const t = raw.trim();
  if (!t) return "";
  const m = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return "";
  const hh = String(Number(m[1])).padStart(2, "0");
  return `${hh}:${m[2]}`;
}

function formatDateTimeLabel(dateIso: string, time?: string) {
  const base = formatDate(dateIso);
  const tt = formatTime(time);
  return tt ? `${base} · ${tt}` : base;
}

async function readFileAsOptimisedJpegBase64(file: File): Promise<{
  base64: string;
  filename: string;
  contentType: string;
}> {
  // Server Actions have payload limits; optimise images client-side for reliability.
  const maxDim = 1600;
  const quality = 0.82;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare image for upload.");
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not prepare image for upload."))),
      "image/jpeg",
      quality,
    );
  });

  const buf = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const safeBase = file.name.replace(/\.[^.]+$/, "").replace(/[^\w.\-]+/g, "_").slice(0, 60);
  return {
    base64,
    filename: `${safeBase || "event"}.jpg`,
    contentType: "image/jpeg",
  };
}

function readFileAsBase64Original(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result ?? "");
      const prefix = "base64,";
      const idx = res.indexOf(prefix);
      if (idx === -1) {
        reject(new Error("Could not read image data."));
        return;
      }
      resolve(res.slice(idx + prefix.length));
    };
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

async function readFileAsUploadBase64(file: File): Promise<{
  base64: string;
  filename: string;
  contentType: string;
}> {
  // Prefer compressing to JPEG for reliability, but allow ANY image format by falling back.
  // (Some browsers can’t decode HEIC/HEIF via canvas/createImageBitmap.)
  try {
    return await readFileAsOptimisedJpegBase64(file);
  } catch {
    const base64 = await readFileAsBase64Original(file);
    return {
      base64,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    };
  }
}

export function EventsAdminPanel({
  authed,
  useSupabase,
}: {
  authed: boolean;
  useSupabase: boolean;
}) {
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState("");
  const [summary, setSummary] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recurringRows, setRecurringRows] = useState<AdminRecurringSetting[]>(RECURRING_DEFAULTS);
  const [recurringLoadError, setRecurringLoadError] = useState<string | null>(null);
  const [recurringBusyKind, setRecurringBusyKind] = useState<RecurringEventKind | null>(null);

  useEffect(() => {
    if (!authed) {
      setEvents([]);
      setRecurringRows(RECURRING_DEFAULTS);
      setRecurringLoadError(null);
      return;
    }
    if (!useSupabase) {
      setEvents(loadAdminEvents());
      return;
    }
    void (async () => {
      setError(null);
      setRecurringLoadError(null);
      try {
        const rows = await listAdminEventsAction();
        setEvents(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load events from Supabase.");
      }
      if (!useSupabase) return;
      try {
        setRecurringRows(await listAdminRecurringSettingsAction());
      } catch (e) {
        setRecurringRows(RECURRING_DEFAULTS);
        setRecurringLoadError(
          e instanceof Error
            ? `${e.message} If this is a new deploy, run the Supabase migration that creates recurring_event_settings.`
            : "Could not load recurring event settings.",
        );
      }
    })();
  }, [authed, useSupabase]);

  useEffect(() => {
    if (!authed || useSupabase) return;
    saveAdminEvents(events);
  }, [authed, useSupabase, events]);

  const sorted = useMemo(() => {
    const filtered = events.filter(
      (ev) =>
        ev.title.trim() !== recurringEventTitles.monthlySatsang &&
        ev.title.trim() !== recurringEventTitles.bhajanSatsang,
    );
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  }, [events]);

  function patchRecurringRow(kind: RecurringEventKind, patch: Partial<AdminRecurringSetting>) {
    setRecurringRows((prev) =>
      prev.map((row) => (row.kind === kind ? { ...row, ...patch } : row)),
    );
  }

  async function saveRecurringRow(kind: RecurringEventKind) {
    const r = recurringRows.find((x) => x.kind === kind);
    if (!r) return;
    setRecurringBusyKind(kind);
    setError(null);
    setRecurringLoadError(null);
    try {
      await upsertAdminRecurringSettingAction({
        kind: r.kind,
        use_automatic_next: r.use_automatic_next,
        hidden_from_site: r.hidden_from_site,
        override_event_date: r.override_event_date,
        override_event_time: r.override_event_time,
      });
      setRecurringRows(await listAdminRecurringSettingsAction());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save recurring settings.");
    } finally {
      setRecurringBusyKind(null);
    }
  }

  function resetForm() {
    setTitle("");
    setDate(todayIso());
    setTime("");
    setSummary("");
    setImageSrc("");
    setPendingImageFile(null);
    setPendingImagePreviewUrl(null);
    setEditingId(null);
  }

  async function onSubmit() {
    const t = title.trim();
    const s = summary.trim();
    if (!t || !date.trim()) return;

    if (useSupabase) {
      setBusy(true);
      setError(null);
      try {
        let imageBase64: string | undefined;
        let imageFilename: string | undefined;
        let imageContentType: string | undefined;
        if (pendingImageFile) {
          const payload = await readFileAsUploadBase64(pendingImageFile);
          imageBase64 = payload.base64;
          imageFilename = payload.filename;
          imageContentType = payload.contentType;
        }
        await upsertAdminEventAction({
          id: editingId ?? undefined,
          title: t,
          date: date.trim(),
          time: normalizeTime(time) || undefined,
          summary: s || undefined,
          imageSrc: imageSrc.trim() || undefined,
          imageBase64,
          imageFilename,
          imageContentType,
        });
        const rows = await listAdminEventsAction();
        setEvents(rows);
        resetForm();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save event.");
      } finally {
        setBusy(false);
      }
      return;
    }

    const next: AdminEventItem = {
      id: editingId ?? newId(),
      title: t,
      date: date.trim(),
      time: normalizeTime(time) || undefined,
      summary: s || undefined,
      imageSrc: imageSrc.trim() || undefined,
    };

    setEvents((prev) => {
      const without = prev.filter((e) => e.id !== next.id);
      return [next, ...without];
    });
    resetForm();
  }

  useEffect(() => {
    if (!pendingImageFile) {
      setPendingImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingImageFile);
    setPendingImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingImageFile]);

  async function copyToSite() {
    const lines = sorted.map((ev) => {
      const obj = {
        dateLabel: formatDateTimeLabel(ev.date, ev.time),
        title: ev.title,
        summary: ev.summary,
        imageSrc: ev.imageSrc,
      } as const;
      return JSON.stringify(obj, null, 2);
    });

    const snippet = `items: [\n${lines
      .map((l) => l.split("\n").map((x) => `  ${x}`).join("\n"))
      .join(",\n")}\n] as const,`;

    try {
      await navigator.clipboard.writeText(snippet);
      setCopyStatus("Copied. Paste into src/content/site.ts → events → items.");
    } catch {
      setCopyStatus("Could not copy automatically. Select and copy manually.");
    }
    window.setTimeout(() => setCopyStatus(null), 5000);
  }

  if (!authed) {
    return (
      <div className="rounded-2xl border-2 border-gold/25 bg-white/90 p-6 shadow-sm sm:p-10">
        <p className="text-xl leading-relaxed text-earth">
          Please sign in to manage events.
        </p>
        <div className="mt-8">
          <Link
            href="/admin/login?next=/admin/events"
            className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-base font-bold text-deep transition hover:bg-saffron"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {error ? (
        <div
          className="rounded-2xl border-2 border-red-900/25 bg-red-50 px-5 py-4 text-base font-medium text-red-950"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {authed && useSupabase ? (
        <div className="rounded-2xl border-2 border-gold/20 bg-white/90 p-6 shadow-sm sm:p-10">
          <h2 className="font-display text-2xl font-bold text-deep">Recurring home-page cards</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-earth/90">
            <strong className="text-deep">Monthly Satsang</strong> and{" "}
            <strong className="text-deep">Bhajan Satsang</strong> still use the same titles, images, and
            descriptions as today — only the <em>next date shown on the site</em> (or visibility) changes
            from here. One-off events stay in the list below.
          </p>
          {recurringLoadError ? (
            <div
              className="mt-4 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              role="status"
            >
              {recurringLoadError}
            </div>
          ) : null}

          <div className="mt-8 space-y-10">
            {recurringRows.map((r) => {
              const help = RECURRING_HELP[r.kind];
              const saving = recurringBusyKind === r.kind;
              return (
                <div
                  key={r.kind}
                  className="rounded-xl border border-earth/15 bg-parchment-muted/35 p-5 sm:p-6"
                >
                  <h3 className="font-display text-lg font-semibold text-deep">{help.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-earth/90">{help.description}</p>

                  <div className="mt-5 space-y-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-earth/40 text-gold focus:ring-gold"
                        checked={r.hidden_from_site}
                        onChange={(e) =>
                          patchRecurringRow(r.kind, { hidden_from_site: e.target.checked })
                        }
                      />
                      <span>
                        <span className="block text-sm font-semibold text-deep">Hide this card</span>
                        <span className="mt-0.5 block text-xs text-earth/75">
                          The event disappears from the home page until you turn this off (e.g. cancelled
                          month).
                        </span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-earth/40 text-gold focus:ring-gold"
                        checked={r.use_automatic_next}
                        onChange={(e) =>
                          patchRecurringRow(r.kind, { use_automatic_next: e.target.checked })
                        }
                      />
                      <span>
                        <span className="block text-sm font-semibold text-deep">
                          Use automatic next date
                        </span>
                        <span className="mt-0.5 block text-xs text-earth/75">
                          Uncheck to set the exact next date visitors should see.
                        </span>
                      </span>
                    </label>

                    {!r.use_automatic_next ? (
                      <div className="grid gap-4 border-t border-gold/15 pt-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-deep">Next date</span>
                          <input
                            type="date"
                            value={r.override_event_date}
                            onChange={(e) =>
                              patchRecurringRow(r.kind, { override_event_date: e.target.value })
                            }
                            className="w-full rounded-xl border-2 border-earth/20 bg-white px-4 py-3 text-base text-ink outline-none ring-gold/40 focus:border-gold focus:ring-2"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-deep">
                            Time (optional)
                          </span>
                          <input
                            type="time"
                            value={r.override_event_time}
                            onChange={(e) =>
                              patchRecurringRow(r.kind, { override_event_time: e.target.value })
                            }
                            className="w-full rounded-xl border-2 border-earth/20 bg-white px-4 py-3 text-base text-ink outline-none ring-gold/40 focus:border-gold focus:ring-2"
                          />
                          <span className="mt-1 block text-xs text-earth/75">
                            Leave blank for the usual time (11:00am monthly · 3:00pm bhajan).
                          </span>
                        </label>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => void saveRecurringRow(r.kind)}
                      disabled={saving || busy}
                      className="rounded-full bg-deep px-6 py-2.5 text-sm font-bold text-parchment transition hover:bg-earth disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving…" : `Save — ${help.title}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : authed && !useSupabase ? (
        <div className="rounded-2xl border border-gold/20 bg-parchment-muted/40 px-5 py-4 text-sm leading-relaxed text-earth">
          <strong className="text-deep">Recurring cards:</strong> when this admin uses Supabase, you can
          override the next Monthly / Bhajan Satsang date or hide a card without editing code. Local-only
          mode still uses the automatic schedule in{" "}
          <code className="text-xs">src/content/site.ts</code>.
        </div>
      ) : null}

      <div className="rounded-2xl border-2 border-gold/20 bg-white/90 p-6 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-deep">Add an event</h2>
          <a
            href="/admin/logout"
            className="rounded-full border-2 border-earth/25 px-4 py-2 text-sm font-semibold text-earth transition hover:border-gold/60 hover:text-deep"
          >
            Log out
          </a>
        </div>

        <div className="mt-8 grid gap-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-deep">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border-2 border-earth/20 bg-white px-4 py-3 text-base text-ink outline-none ring-gold/40 focus:border-gold focus:ring-2"
              placeholder="e.g. Diwali celebration"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-deep">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border-2 border-earth/20 bg-white px-4 py-3 text-base text-ink outline-none ring-gold/40 focus:border-gold focus:ring-2"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-deep">Time (optional)</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border-2 border-earth/20 bg-white px-4 py-3 text-base text-ink outline-none ring-gold/40 focus:border-gold focus:ring-2"
            />
            <p className="mt-2 text-sm text-earth/80">Leave blank if there’s no specific start time.</p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-deep">
              Summary (optional)
            </span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-xl border-2 border-earth/20 bg-white px-4 py-3 text-base text-ink outline-none ring-gold/40 focus:border-gold focus:ring-2"
              placeholder="Short description (1–3 sentences). Leave blank if you want."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-deep">Image (optional)</span>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              className="block w-full rounded-xl border-2 border-earth/20 bg-white px-4 py-3 text-base text-ink outline-none ring-gold/40 focus:border-gold focus:ring-2"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (!f) return;
                setPendingImageFile(f);
                if (!useSupabase) {
                  setImageSrc(`/events/${f.name}`);
                }
              }}
            />
            <p className="mt-2 text-sm text-earth/80">
              {useSupabase ? (
                <>
                  Choose a photo to upload to Supabase storage (public URL is saved on the event). You can
                  still paste an image URL below instead.
                </>
              ) : (
                <>
                  Choose a photo and we’ll auto-fill the path as <code className="text-xs">/events/filename</code>
                  . Put the file in <code className="text-xs">public/events/</code> when you deploy.
                </>
              )}
            </p>

            {pendingImageFile ? (
              <div className="mt-3 rounded-xl border border-gold/20 bg-parchment-muted/50 px-4 py-3 text-sm text-earth">
                <p className="font-semibold text-deep">
                  New image selected{useSupabase ? " (will replace current image on save)" : ""}:
                </p>
                <p className="mt-1">
                  <code className="text-xs">{pendingImageFile.name}</code>
                </p>
                {pendingImagePreviewUrl ? (
                  <div className="mt-3 overflow-hidden rounded-lg border border-gold/15 bg-white/70">
                    <img
                      src={pendingImagePreviewUrl}
                      alt="New event image preview"
                      className="h-44 w-full object-contain"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {imageSrc.trim() ? (
              <div className="mt-3 rounded-xl border border-earth/15 bg-white/70 px-4 py-3 text-sm text-earth">
                <p className="font-semibold text-deep">Current image</p>
                <div className="mt-3 overflow-hidden rounded-lg border border-earth/10 bg-white/70">
                  <img
                    src={imageSrc.trim()}
                    alt="Current event image"
                    className="h-44 w-full object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            ) : null}

            <div className="mt-3">
            <input
              value={imageSrc}
              onChange={(e) => setImageSrc(e.target.value)}
              className="w-full rounded-xl border-2 border-earth/20 bg-white px-4 py-3 text-base text-ink outline-none ring-gold/40 focus:border-gold focus:ring-2"
              placeholder="e.g. /events/diwali.jpg (in public/) or https://…"
            />
            </div>

            {imageSrc.trim() || pendingImageFile ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingImageFile(null);
                    setPendingImagePreviewUrl(null);
                    setImageSrc("");
                  }}
                  className="rounded-full border border-earth/25 bg-white/70 px-4 py-2 text-sm font-semibold text-earth transition hover:border-gold/60 hover:text-deep"
                >
                  Remove image
                </button>
              </div>
            ) : null}
          </label>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={busy}
              className="rounded-full bg-gold px-6 py-3 text-base font-bold text-deep transition hover:bg-saffron disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Saving…" : editingId ? "Save changes" : "Add event"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border-2 border-earth/25 px-6 py-3 text-base font-semibold text-earth transition hover:border-gold/60 hover:text-deep"
              >
                Cancel
              </button>
            ) : null}
          </div>

          <div className="rounded-xl border border-gold/20 bg-parchment-muted/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-deep">
                Publish to the website (copy/paste)
              </p>
              <button
                type="button"
                onClick={() => void copyToSite()}
                className="rounded-full border-2 border-gold/50 bg-white/70 px-4 py-2 text-sm font-semibold text-gold-dim transition hover:border-gold hover:bg-white hover:text-deep"
              >
                Copy for site
              </button>
            </div>
            <p className="mt-2 text-sm text-earth/80">
              {useSupabase ? (
                <>
                  With Supabase configured, published events appear on the home page automatically. You can
                  still use <strong className="text-deep">Copy for site</strong> if you also want static cards
                  in <code className="text-xs">src/content/site.ts</code>.
                </>
              ) : (
                <>
                  This admin page saves drafts on this device. To show events to everyone, paste the copied
                  snippet into <code className="text-xs">src/content/site.ts</code> under{" "}
                  <code className="text-xs">events.items</code>, then deploy.
                </>
              )}
            </p>
            {copyStatus ? (
              <p className="mt-2 text-sm font-medium text-deep" role="status">
                {copyStatus}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gold/20 bg-white/70 p-6 shadow-sm sm:p-8">
        <h3 className="font-display text-xl font-semibold text-deep">Events</h3>
        {sorted.length === 0 ? (
          <p className="mt-3 text-earth">No events yet.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {sorted.map((ev) => (
              <li
                key={ev.id}
                className="rounded-2xl border border-earth/15 bg-white/90 p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gold-dim">
                      {formatDateTimeLabel(ev.date, ev.time)}
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold text-deep">
                      {ev.title}
                    </p>
                    {ev.summary ? (
                      <p className="mt-2 text-sm leading-relaxed text-earth/85">{ev.summary}</p>
                    ) : null}
                    {ev.imageSrc ? (
                      <p className="mt-2 text-xs text-earth/70">
                        Image: <code className="text-[0.7rem]">{ev.imageSrc}</code>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(ev.id);
                        setTitle(ev.title);
                        setDate(ev.date);
                        setTime(normalizeTime(ev.time ?? ""));
                        setSummary(ev.summary ?? "");
                        setImageSrc(ev.imageSrc ?? "");
                        setPendingImageFile(null);
                      }}
                      className="rounded-full border border-earth/25 px-4 py-2 text-sm font-semibold text-earth transition hover:border-gold/60 hover:text-deep"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          if (useSupabase) {
                            const ok = window.confirm("Delete this event from Supabase?");
                            if (!ok) return;
                            setBusy(true);
                            setError(null);
                            try {
                              await deleteAdminEventAction(ev.id);
                              setEvents(await listAdminEventsAction());
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Could not delete event.");
                            } finally {
                              setBusy(false);
                            }
                            return;
                          }
                          setEvents((prev) => prev.filter((x) => x.id !== ev.id));
                        })();
                      }}
                      className="rounded-full border border-red-900/20 bg-red-50 px-4 py-2 text-sm font-semibold text-red-950 transition hover:border-red-900/35"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

