-- Add optional start time to highlighted events (admin-managed).
-- `time` comes through Supabase as a string (e.g. "15:00:00").

alter table public.events
  add column if not exists event_time time;

