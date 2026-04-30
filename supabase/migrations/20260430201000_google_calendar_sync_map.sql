-- Stores Google Calendar event ids for non-table events (e.g. recurring generated cards).

create table if not exists public.google_calendar_sync_map (
  key text primary key,
  google_event_id text,
  synced_at timestamptz not null default now(),
  last_error text
);

