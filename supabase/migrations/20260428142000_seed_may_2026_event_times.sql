-- Follow-up seed: add times for May 2026 highlighted events (requires `event_time` column).
-- Safe to re-run: updates specific rows by title + date.

update public.events
set
  event_time = time '11:00',
  date_label = 'Sun 3 May 2026 · 11:00am'
where title = 'Sunday Satsang'
  and event_date = date '2026-05-03';

update public.events
set
  event_time = time '15:00',
  date_label = 'Sat 9 May 2026 · 3:00pm'
where title = 'Indian Arrival Day'
  and event_date = date '2026-05-09';

update public.events
set
  event_time = time '15:00',
  date_label = 'Sat 16 May 2026 · 3:00pm'
where title = 'Bhajan Satsang'
  and event_date = date '2026-05-16';

