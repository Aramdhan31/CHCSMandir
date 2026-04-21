import { EVENTS_ADMIN_COOKIE, isEventsAdmin } from "@/lib/events/adminCookie";
import {
  MEMBERSHIPS_ADMIN_COOKIE,
  parseMembershipsRole,
} from "@/lib/memberships/adminCookie";

/** Cookie bag from `cookies()` or `NextRequest.cookies`. */
type CookieGetter = {
  get(name: string): { value?: string } | undefined;
};

/**
 * Who may load `/admin/events` and run events server actions.
 * Matches unified login: memberships **edit** is treated like full committee access for events.
 */
export function canManageEventsAdmin(cookies: CookieGetter): boolean {
  if (isEventsAdmin(cookies.get(EVENTS_ADMIN_COOKIE)?.value)) return true;
  return parseMembershipsRole(cookies.get(MEMBERSHIPS_ADMIN_COOKIE)?.value) === "edit";
}
