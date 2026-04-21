-- Split legacy `address` into UK-style postal fields.
-- Run if the app errors: column membership_members.address_line1 does not exist
-- (DB was created from an older split migration that only had `address`).

alter table public.membership_members
  add column if not exists address_line1 text not null default '',
  add column if not exists address_line2 text not null default '',
  add column if not exists city text not null default '',
  add column if not exists postcode text not null default '';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'membership_members'
      and column_name = 'address'
  ) then
    update public.membership_members
    set address_line1 = trim(coalesce(address, ''));

    alter table public.membership_members drop column address;
  end if;
end;
$$;
