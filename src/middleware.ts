import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canManageEventsAdmin } from "@/lib/admin/eventsAccess";
import { EVENTS_ADMIN_COOKIE, isEventsAdmin } from "@/lib/events/adminCookie";
import {
  MEMBERSHIPS_ADMIN_COOKIE,
  parseMembershipsRole,
} from "@/lib/memberships/adminCookie";

function isPublicAdminPath(pathname: string) {
  if (pathname === "/admin/login") return true;
  if (pathname === "/admin/logout") return true;
  if (pathname === "/admin/memberships/login") return true;
  if (pathname === "/admin/events/logout") return true;
  if (pathname === "/admin/memberships/logout") return true;
  return false;
}

function loginUrl(request: NextRequest, next: string) {
  const u = new URL("/admin/login", request.url);
  u.searchParams.set("next", next);
  return u;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  /** Old URL; events auth is only via `/admin/login`. */
  if (pathname === "/admin/events/login") {
    const nextQ = request.nextUrl.searchParams.get("next")?.trim();
    const dest = new URL("/admin/login", request.url);
    const safe =
      nextQ &&
      nextQ.startsWith("/") &&
      !nextQ.startsWith("//") &&
      nextQ.startsWith("/admin")
        ? nextQ
        : "/admin/events";
    dest.searchParams.set("next", safe);
    return NextResponse.redirect(dest);
  }

  if (isPublicAdminPath(pathname)) {
    return NextResponse.next();
  }

  const eventsAuthed = isEventsAdmin(request.cookies.get(EVENTS_ADMIN_COOKIE)?.value);
  const memRole = parseMembershipsRole(request.cookies.get(MEMBERSHIPS_ADMIN_COOKIE)?.value);
  const memAuthed = Boolean(memRole);

  if (pathname === "/admin" || pathname === "/admin/") {
    if (eventsAuthed || memAuthed) return NextResponse.next();
    return NextResponse.redirect(loginUrl(request, "/admin"));
  }

  if (pathname.startsWith("/admin/events")) {
    if (canManageEventsAdmin(request.cookies)) return NextResponse.next();
    return NextResponse.redirect(loginUrl(request, pathname));
  }

  if (pathname.startsWith("/admin/memberships")) {
    if (memAuthed) return NextResponse.next();
    return NextResponse.redirect(loginUrl(request, pathname));
  }

  if (eventsAuthed || memAuthed) return NextResponse.next();
  return NextResponse.redirect(loginUrl(request, "/admin"));
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
