export type AdminEventItem = {
  id: string;
  /** ISO date `YYYY-MM-DD` */
  date: string;
  title: string;
  /** Optional short summary (1–3 sentences) */
  summary?: string;
  /** Optional image path or URL (e.g. `/events/diwali.jpg`) */
  imageSrc?: string;
};

