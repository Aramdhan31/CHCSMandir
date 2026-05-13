-- Admin-controlled overrides for the two auto-generated recurring home cards
-- (Monthly Satsang, Bhajan Satsang): next date/time or hide from site.

create table if not exists public.recurring_event_settings (
  kind text primary key check (kind in ('monthly_satsang', 'bhajan_satsang')),
  use_automatic_next boolean not null default true,
  override_event_date date null,
  override_event_time time null,
  hidden_from_site boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.recurring_event_settings (kind)
values ('monthly_satsang'), ('bhajan_satsang')
on conflict (kind) do nothing;

alter table public.recurring_event_settings enable row level security;

drop policy if exists "Public can read recurring event settings" on public.recurring_event_settings;
create policy "Public can read recurring event settings"
  on public.recurring_event_settings
  for select
  to anon, authenticated
  using (true);

revoke all on public.recurring_event_settings from anon, authenticated;
grant select on public.recurring_event_settings to anon, authenticated;

grant select, insert, update, delete on public.recurring_event_settings to service_role;
