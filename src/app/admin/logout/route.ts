import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { EVENTS_ADMIN_COOKIE } from "@/lib/events/adminCookie";
import { MEMBERSHIPS_ADMIN_COOKIE } from "@/lib/memberships/adminCookie";

const clearOpts = {
  path: "/admin",
  maxAge: 0,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login", request.url));
  res.cookies.set(EVENTS_ADMIN_COOKIE, "", clearOpts);
  res.cookies.set(MEMBERSHIPS_ADMIN_COOKIE, "", clearOpts);
  return res;
}
