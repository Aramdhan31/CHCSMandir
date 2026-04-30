-- Capture membership/donation details **before** redirecting to SumUp payment.
-- Stored server-side via the Supabase service role (no public RLS policies).

create table if not exists public.membership_payment_intents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  kind text not null check (kind in ('membership', 'donation')),
  membership_year int,
  message text,
  user_agent text,
  sumup_url text,
  created_at timestamptz not null default now()
);

create index if not exists membership_payment_intents_created_at_desc_idx
  on public.membership_payment_intents (created_at desc);

alter table public.membership_payment_intents enable row level security;

-- No public policies: only server-side service role should write/read.
revoke all on public.membership_payment_intents from anon, authenticated;

-- PostgREST still needs explicit grants for service_role.
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.membership_payment_intents to service_role;

