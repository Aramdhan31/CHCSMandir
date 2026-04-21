const LOCALE = "en-GB";

/** Title-case one segment (letters only; rest unchanged). */
function titleCaseSegment(seg: string): string {
  if (!seg) return seg;
  const first = seg[0];
  if (!first) return seg;
  return first.toLocaleUpperCase(LOCALE) + seg.slice(1).toLocaleLowerCase(LOCALE);
}

/** Title-case each word: spaces split words; hyphens split sub-words (e.g. Jean-Pierre). */
export function titleCaseWords(s: string): string {
  const t = s.trim();
  if (!t) return "";
  return t
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.split("-").map(titleCaseSegment).join("-"))
    .join(" ");
}

/**
 * Surname for display/sort: last whitespace-delimited part of full name, title-cased per word.
 * Matches Postgres `initcap(lower(token))` on that token for `membership_members_sync_surname`.
 */
export function surnameFromFullName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "";
  const parts = t.split(/\s+/).filter(Boolean);
  const last = parts[parts.length - 1] ?? t;
  return titleCaseWords(last);
}

/** List / labels: title-case whatever is stored (fixes legacy all-lowercase `surname` rows). */
export function displaySurname(stored: string): string {
  return titleCaseWords(stored.trim());
}

export function phoneGroupKey(phone: string, fallbackUnique: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 6) return digits;
  return `ROW:${fallbackUnique}`;
}
