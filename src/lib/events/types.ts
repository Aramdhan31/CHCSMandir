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

