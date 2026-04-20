/** HttpOnly session for membership admin routes (set after PIN check). Value = role. */
export const MEMBERSHIPS_ADMIN_COOKIE = "chcs_memberships_admin";

export type MembershipsAdminRole = "view" | "edit";

export const MEMBERSHIP_COOKIE_VIEW = "view";
export const MEMBERSHIP_COOKIE_EDIT = "edit";
/** Older deployments stored `"1"` for full access — still accepted as edit. */
export const MEMBERSHIP_COOKIE_LEGACY_EDIT = "1";

export function parseMembershipsRole(
  value: string | undefined,
): MembershipsAdminRole | null {
  if (!value) return null;
  if (value === MEMBERSHIP_COOKIE_VIEW) return "view";
  if (value === MEMBERSHIP_COOKIE_EDIT || value === MEMBERSHIP_COOKIE_LEGACY_EDIT) {
    return "edit";
  }
  return null;
}
