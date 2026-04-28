-- Remove seeded Sunday Satsang row (monthly satsang is shown separately on the site).
delete from public.events
where title = 'Sunday Satsang'
  and event_date = date '2026-05-03';

