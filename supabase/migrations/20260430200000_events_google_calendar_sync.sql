-- Sync admin-created events into the shared CHCS Mandir Google Calendar.
-- We store the Google Calendar "event id" so edits/unpublishes can update/delete.

alter table if exists public.events
  add column if not exists google_calendar_event_id text,
  add column if not exists google_calendar_synced_at timestamptz,
  add column if not exists google_calendar_last_error text;

