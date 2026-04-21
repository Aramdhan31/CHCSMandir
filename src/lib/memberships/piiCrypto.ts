import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** Stored in DB before base64 payload */
const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function loadKey(): Buffer {
  const raw = process.env.MEMBERSHIP_PII_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error(
      "MEMBERSHIP_PII_ENCRYPTION_KEY is not set. Add a 32-byte key to .env.local (server only), e.g. output of: openssl rand -base64 32",
    );
  }
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error(
      "MEMBERSHIP_PII_ENCRYPTION_KEY must decode to exactly 32 bytes (use openssl rand -base64 32, or 64 hex characters).",
    );
  }
  return buf;
}

export function membershipPiiEncryptionEnabled(): boolean {
  return Boolean(process.env.MEMBERSHIP_PII_ENCRYPTION_KEY?.trim());
}

/** Encrypt UTF-8 string for storage in Postgres text column. */
export function encryptPiiField(plain: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, enc]).toString("base64")}`;
}

/** Decrypt value from DB; returns input unchanged if not wrapped (legacy plaintext rows). */
export function decryptPiiField(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;
  const key = loadKey();
  const buf = Buffer.from(stored.slice(PREFIX.length), "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function encryptPiiNullable(plain: string | null): string | null {
  if (plain === null) return null;
  return encryptPiiField(plain);
}

export function decryptPiiNullable(stored: string | null): string | null {
  if (stored === null) return null;
  return decryptPiiField(stored);
}

/** Values written to `membership_members` — encrypt when `MEMBERSHIP_PII_ENCRYPTION_KEY` is set. */
export function persistMemberAddress(plain: string): string {
  const t = plain.trim();
  if (t === "") return "";
  return membershipPiiEncryptionEnabled() ? encryptPiiField(t) : t;
}

export function persistMemberPhone(plain: string): string {
  const t = plain.trim();
  if (t === "") return "";
  return membershipPiiEncryptionEnabled() ? encryptPiiField(t) : t;
}

export function persistMemberEmail(plain: string | null | undefined): string | null {
  const t = plain?.trim() ?? "";
  if (!t) return null;
  return membershipPiiEncryptionEnabled() ? encryptPiiField(t) : t;
}
