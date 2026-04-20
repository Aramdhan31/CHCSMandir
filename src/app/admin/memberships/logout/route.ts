import { NextResponse } from "next/server";
import { MEMBERSHIPS_ADMIN_COOKIE } from "@/lib/memberships/adminCookie";

export function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/admin/memberships/login", request.url));
  res.cookies.set(MEMBERSHIPS_ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 0,
  });
  return res;
}
