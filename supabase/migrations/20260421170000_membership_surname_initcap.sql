-- Title-case stored surname (each word). Fixes rows created before initcap trigger.
-- Safe to re-run.

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
  new.surname := initcap(lower(token));
  return new;
end;
$$;

update public.membership_members
set surname = initcap(lower(surname));
