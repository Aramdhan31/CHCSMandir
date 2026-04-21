/** HttpOnly session for event admin routes (set after PIN check). */
export const EVENTS_ADMIN_COOKIE = "chcs_events_admin";

export const EVENTS_COOKIE_OK = "ok";

export function isEventsAdmin(value: string | undefined): boolean {
  return value === EVENTS_COOKIE_OK;
}

