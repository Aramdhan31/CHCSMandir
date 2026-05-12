-- Allow "membership + donation" intents; store optional extra donation for reporting.

alter table public.membership_payment_intents
  add column if not exists donation_amount_gbp numeric(10,2);

alter table public.membership_payment_intents
  drop constraint if exists membership_payment_intents_kind_check;

alter table public.membership_payment_intents
  add constraint membership_payment_intents_kind_check
  check (kind in ('membership', 'donation', 'membership_donation'));
