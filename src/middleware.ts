import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  MEMBERSHIPS_ADMIN_COOKIE,
  parseMembershipsRole,
} from "@/lib/memberships/adminCookie";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin/memberships")) {
    return NextResponse.next();
  }
  if (
    pathname.startsWith("/admin/memberships/login") ||
    pathname.startsWith("/admin/memberships/logout")
  ) {
    return NextResponse.next();
  }
  const session = request.cookies.get(MEMBERSHIPS_ADMIN_COOKIE);
  if (parseMembershipsRole(session?.value)) {
    return NextResponse.next();
  }
  const login = new URL("/admin/memberships/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  /** Include the index route and nested paths (e.g. login). */
  matcher: ["/admin/memberships", "/admin/memberships/:path*"],
};
