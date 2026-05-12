-- Removes Google Calendar API sync artefacts (website uses per-card Add to Calendar only).

drop table if exists public.google_calendar_sync_map;

alter table if exists public.events
  drop column if exists google_calendar_event_id,
  drop column if exists google_calendar_synced_at,
  drop column if exists google_calendar_last_error;
