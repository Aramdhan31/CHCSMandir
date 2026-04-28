-- Seed: May 2026 highlighted events (admin-manageable).
-- Safe to re-run: checks for existing (title + event_date) rows.

do $$
begin
  if not exists (
    select 1 from public.events
    where title = 'Sunday Satsang'
      and event_date = date '2026-05-03'
  ) then
    insert into public.events (title, event_date, event_time, date_label, summary, image_public_url, published, sort_order)
    values (
      'Sunday Satsang',
      date '2026-05-03',
      time '11:00',
      'Sun 3 May 2026 · 11:00am',
      'All are welcome.',
      null,
      true,
      0
    );
  end if;

  if not exists (
    select 1 from public.events
    where title = 'Indian Arrival Day'
      and event_date = date '2026-05-09'
  ) then
    insert into public.events (title, event_date, event_time, date_label, summary, image_public_url, published, sort_order)
    values (
      'Indian Arrival Day',
      date '2026-05-09',
      time '15:00',
      'Sat 9 May 2026 · 3:00pm',
      'All are welcome.',
      null,
      true,
      0
    );
  end if;

  if not exists (
    select 1 from public.events
    where title = 'Bhajan Satsang'
      and event_date = date '2026-05-16'
  ) then
    insert into public.events (title, event_date, event_time, date_label, summary, image_public_url, published, sort_order)
    values (
      'Bhajan Satsang',
      date '2026-05-16',
      time '15:00',
      'Sat 16 May 2026 · 3:00pm',
      'All are welcome.',
      null,
      true,
      0
    );
  end if;
end;
$$;

