-- Split contact (per person) from payment lines (per year).
-- Run once in Supabase SQL Editor after `20260421120000_events_and_memberships.sql`.

-- ---------- Members (one row per person) ----------
create table if not exists public.membership_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  surname text not null default '',
  address_line1 text not null default '',
  address_line2 text not null default '',
  city text not null default '',
  postcode text not null default '',
  email text,
  phone text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.membership_members_sync_surname()
returns trigger
language plpgsql
as $$
declare
  token text;
begin
  token := coalesce(
    nullif(trim(split_part(trim(new.full_name), ' ', -1)), ''),
    trim(new.full_name)
  );
  -- Title case each word (matches app `surnameFromFullName`); list sort still uses lower(surname).
  new.surname := initcap(lower(token));
  return new;
end;
$$;

drop trigger if exists membership_members_sync_surname_trg on public.membership_members;
create trigger membership_members_sync_surname_trg
  before insert or update of full_name on public.membership_members
  for each row
  execute procedure public.membership_members_sync_surname();

create index if not exists membership_members_surname_sort_idx
  on public.membership_members (lower(surname), lower(full_name));

alter table public.membership_members enable row level security;
revoke all on public.membership_members from anon, authenticated;
grant select, insert, update, delete on table public.membership_members to service_role;

-- ---------- Link payments to members; migrate from flat rows ----------
alter table public.membership_records
  add column if not exists member_id uuid references public.membership_members (id) on delete cascade;

do $$
declare
  r record;
  g text;
  mid uuid;
  flat_ledger boolean;
begin
  -- If `phone` is gone, this database already ran the split (or equivalent); do not reference flat columns.
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'membership_records'
      and column_name = 'phone'
  )
  into flat_ledger;

  create temporary table _mem_grp_map (grp text primary key, member_id uuid not null);

  if flat_ledger then
    for r in
      select
        mr.*,
        coalesce(nullif(regexp_replace(mr.phone, '[^0-9]', '', 'g'), ''), 'ROW:' || mr.id) as grp_key
      from public.membership_records mr
      where mr.member_id is null
    loop
      g := r.grp_key;
      select m.member_id into mid from _mem_grp_map m where m.grp = g;
      if mid is null then
        insert into public.membership_members (
          full_name,
          address_line1,
          address_line2,
          city,
          postcode,
          email,
          phone,
          notes,
          created_at,
          updated_at
        )
        values (
          r.full_name,
          trim(coalesce(r.address, '')),
          '',
          '',
          '',
          r.email,
          r.phone,
          null::text,
          r.created_at,
          r.updated_at
        )
        returning id into mid;
        insert into _mem_grp_map (grp, member_id) values (g, mid);
      end if;
      update public.membership_records set member_id = mid where id = r.id;
    end loop;
  end if;

  if not exists (select 1 from public.membership_records where member_id is null) then
    alter table public.membership_records alter column member_id set not null;
  end if;
end;
$$;

drop index if exists membership_records_paid_on_desc_idx;

alter table public.membership_records
  drop column if exists full_name,
  drop column if exists address,
  drop column if exists email,
  drop column if exists phone;

create index if not exists membership_records_member_paid_idx
  on public.membership_records (member_id, paid_on desc);

grant select, insert, update, delete on table public.membership_members to service_role;
