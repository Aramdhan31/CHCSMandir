"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  MEMBERSHIPS_ADMIN_COOKIE,
  MEMBERSHIP_COOKIE_EDIT,
  MEMBERSHIP_COOKIE_VIEW,
} from "@/lib/memberships/adminCookie";

type LoginState = { error: string } | null;

function resolvePins(): { view: string | null; edit: string | null } {
  const isDev = process.env.NODE_ENV === "development";
  const viewEnv = process.env.MEMBERSHIPS_VIEW_PIN?.trim();
  const editEnv = process.env.MEMBERSHIPS_ADMIN_PIN?.trim();
  if (isDev) {
    return {
      view: viewEnv ?? "view",
      edit: editEnv ?? "dev",
    };
  }
  return { view: viewEnv || null, edit: editEnv || null };
}

export async function loginMembershipsAdmin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const pin = String(formData.get("pin") ?? "").trim();
  const { view: viewPin, edit: editPin } = resolvePins();

  if (!pin) {
    return { error: "Please enter a PIN." };
  }

  if (!viewPin && !editPin) {
    return {
      error:
        "Membership PINs are not configured. Set MEMBERSHIPS_VIEW_PIN and/or MEMBERSHIPS_ADMIN_PIN on the server.",
    };
  }

  let cookieValue: string | null = null;
  if (editPin && pin === editPin) {
    cookieValue = MEMBERSHIP_COOKIE_EDIT;
  } else if (viewPin && pin === viewPin) {
    cookieValue = MEMBERSHIP_COOKIE_VIEW;
  }

  if (!cookieValue) {
    return { error: "That PIN was not recognised." };
  }

  const jar = await cookies();
  jar.set(MEMBERSHIPS_ADMIN_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}
