-- Server actions use the Supabase **service_role** JWT. Postgres still needs table grants.
-- Run this in the SQL Editor if you see: "permission denied for table membership_records"

grant usage on schema public to service_role;

grant select, insert, update, delete on table public.membership_records to service_role;

grant select, insert, update, delete on table public.events to service_role;
