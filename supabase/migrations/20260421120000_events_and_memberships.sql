-- CHCS site: highlighted home-page events + membership payment ledger.
-- Apply in Supabase SQL editor or via `supabase db push` if you use the CLI.

-- ---------- Events (public read of published rows via anon key + RLS) ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  date_label text not null,
  summary text,
  image_public_url text,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_event_date_desc_idx on public.events (event_date desc);

alter table public.events enable row level security;

drop policy if exists "Public can read published events" on public.events;
create policy "Public can read published events"
  on public.events
  for select
  to anon, authenticated
  using (published = true);

-- Tighten grants — anon/authenticated only need SELECT on this table.
revoke all on public.events from anon, authenticated;
grant select on public.events to anon, authenticated;

-- ---------- Membership ledger (no public policies — use service role server-side) ----------
create table if not exists public.membership_records (
  id text primary key,
  full_name text not null,
  address text not null,
  email text,
  phone text not null,
  paid_on date not null,
  membership_year int not null,
  member_entry_kind text not null check (member_entry_kind in ('new_member', 'yearly_renewal')),
  payment_method text not null check (payment_method in ('cash', 'bank_transfer', 'other')),
  membership_amount_gbp numeric(12, 2) not null,
  donation_amount_gbp numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists membership_records_paid_on_desc_idx
  on public.membership_records (paid_on desc);

alter table public.membership_records enable row level security;

-- No SELECT/INSERT/UPDATE/DELETE policies for anon/authenticated: only the service role
-- (used from Next.js server actions) can read/write this table.

revoke all on public.membership_records from anon, authenticated;

-- ---------- Storage bucket for event images (public read) ----------
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read event images" on storage.objects;
create policy "Public read event images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'event-images');

-- ---------- Server (service_role key): PostgREST still needs table grants ----------
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.events to service_role;
grant select, insert, update, delete on table public.membership_records to service_role;
