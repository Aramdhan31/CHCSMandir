-- Add an explicit amount field for online membership/donation submissions.

alter table public.membership_payment_intents
  add column if not exists amount_gbp numeric(10,2);

-- New submissions should include an amount; older rows may have null.
alter table public.membership_payment_intents
  add constraint membership_payment_intents_amount_positive
  check (amount_gbp is null or amount_gbp > 0) not valid;

