"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EVENTS_ADMIN_COOKIE, EVENTS_COOKIE_OK } from "@/lib/events/adminCookie";
import {
  MEMBERSHIPS_ADMIN_COOKIE,
  MEMBERSHIP_COOKIE_EDIT,
  MEMBERSHIP_COOKIE_VIEW,
} from "@/lib/memberships/adminCookie";

type LoginState = { error: string } | null;

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
  };
}

function maxAgeFromRemember(remember: boolean) {
  return remember ? 60 * 60 * 24 * 90 : 60 * 60 * 24 * 7;
}

function resolvePins(): {
  chcs: string | null;
  events: string | null;
  memEdit: string | null;
  memView: string | null;
} {
  const isDev = process.env.NODE_ENV === "development";
  const chcs = process.env.CHCS_ADMIN_PIN?.trim();
  const events = process.env.EVENTS_ADMIN_PIN?.trim();
  const memEdit = process.env.MEMBERSHIPS_ADMIN_PIN?.trim();
  const memView = process.env.MEMBERSHIPS_VIEW_PIN?.trim();
  if (isDev) {
    return {
      chcs: chcs ?? "chcs",
      events: events ?? "events",
      memEdit: memEdit ?? "dev",
      memView: memView ?? "view",
    };
  }
  return {
    chcs: chcs || null,
    events: events || null,
    memEdit: memEdit || null,
    memView: memView || null,
  };
}

function safeNextPath(raw: string): string {
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/admin";
  if (!t.startsWith("/admin")) return "/admin";
  if (t === "/admin" || t === "/admin/") return "/admin";
  if (t.startsWith("/admin/events")) return t;
  if (t.startsWith("/admin/memberships")) return t;
  return "/admin";
}

function postLoginRedirect(next: string, hasEvents: boolean, hasMemberships: boolean): string {
  const n = safeNextPath(next);
  if (n.startsWith("/admin/events") && !hasEvents) return "/admin";
  if (n.startsWith("/admin/memberships") && !hasMemberships) return "/admin";
  return n;
}

export async function loginUnifiedAdmin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const pin = String(formData.get("pin") ?? "").trim();
  const remember = formData.get("remember") === "on";
  const next = safeNextPath(String(formData.get("next") ?? "/admin"));
  const maxAge = maxAgeFromRemember(remember);

  if (!pin) return { error: "Please enter the committee PIN." };

  const p = resolvePins();
  const jar = await cookies();
  const base = cookieBase();

  if (p.chcs && pin === p.chcs) {
    jar.set(EVENTS_ADMIN_COOKIE, EVENTS_COOKIE_OK, { ...base, maxAge });
    jar.set(MEMBERSHIPS_ADMIN_COOKIE, MEMBERSHIP_COOKIE_EDIT, { ...base, maxAge });
    redirect(postLoginRedirect(next, true, true));
  }
  if (p.events && pin === p.events) {
    jar.set(EVENTS_ADMIN_COOKIE, EVENTS_COOKIE_OK, { ...base, maxAge });
    redirect(postLoginRedirect(next, true, false));
  }
  if (p.memEdit && pin === p.memEdit) {
    // One committee edit PIN: unlock events + memberships (same as CHCS_ADMIN_PIN for access scope).
    jar.set(EVENTS_ADMIN_COOKIE, EVENTS_COOKIE_OK, { ...base, maxAge });
    jar.set(MEMBERSHIPS_ADMIN_COOKIE, MEMBERSHIP_COOKIE_EDIT, { ...base, maxAge });
    redirect(postLoginRedirect(next, true, true));
  }
  if (p.memView && pin === p.memView) {
    jar.set(MEMBERSHIPS_ADMIN_COOKIE, MEMBERSHIP_COOKIE_VIEW, { ...base, maxAge });
    redirect(postLoginRedirect(next, false, true));
  }

  if (!p.chcs && !p.events && !p.memEdit && !p.memView) {
    return {
      error:
        "No committee PINs are configured on the server. Set CHCS_ADMIN_PIN (recommended) and/or EVENTS_ADMIN_PIN, MEMBERSHIPS_ADMIN_PIN, MEMBERSHIPS_VIEW_PIN.",
    };
  }

  return { error: "That PIN was not recognised." };
}
