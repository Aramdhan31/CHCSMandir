-- Seed: May 2026 highlighted events (admin-manageable).
-- Safe to re-run: checks for existing (title + event_date) rows.

do $$
begin
  if not exists (
    select 1 from public.events
    where title = 'Sunday Satsang'
      and event_date = date '2026-05-03'
  ) then
    insert into public.events (title, event_date, date_label, summary, image_public_url, published, sort_order)
    values (
      'Sunday Satsang',
      date '2026-05-03',
      'Sun 3 May 2026',
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
    insert into public.events (title, event_date, date_label, summary, image_public_url, published, sort_order)
    values (
      'Indian Arrival Day',
      date '2026-05-09',
      'Sat 9 May 2026',
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
    insert into public.events (title, event_date, date_label, summary, image_public_url, published, sort_order)
    values (
      'Bhajan Satsang',
      date '2026-05-16',
      'Sat 16 May 2026',
      'All are welcome.',
      null,
      true,
      0
    );
  end if;
end;
$$;

