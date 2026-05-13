export type AdminEventItem = {
  id: string;
  /** ISO date `YYYY-MM-DD` */
  date: string;
  /** Optional local time (24h) `HH:MM` (or `HH:MM:SS` from DB). */
  time?: string;
  title: string;
  /** Optional short summary (1–3 sentences) */
  summary?: string;
  /** Optional image path or URL (e.g. `/events/diwali.jpg`) */
  imageSrc?: string;
};

/** Matches `public.recurring_event_settings.kind` and `RecurringEventKind` in `site.ts`. */
export type RecurringEventKind = "monthly_satsang" | "bhajan_satsang";

export type PublishedRecurringSetting = {
  use_automatic_next: boolean;
  override_event_date: string | null;
  override_event_time: string | null;
  hidden_from_site: boolean;
};

export type AdminRecurringSetting = {
  kind: RecurringEventKind;
  use_automatic_next: boolean;
  /** ISO date when manual; empty when automatic */
  override_event_date: string;
  /** `HH:MM` for form; empty = use default (11:00 / 15:00) */
  override_event_time: string;
  hidden_from_site: boolean;
};

