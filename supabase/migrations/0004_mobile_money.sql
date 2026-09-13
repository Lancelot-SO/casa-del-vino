-- Casa del Vino — manual payments until Paystack is connected.
-- Run this whole file in the Supabase SQL editor after 0003.
--
-- Two new ways to pay:
--   momo  the customer sends MTN Mobile Money / Telecel Cash to the shop's
--         number, quoting the product name as the reference
--   call  the customer phones the shop to arrange payment
-- Both create a pending, unpaid order; the admin marks it paid once the
-- money shows up (Admin → Orders → payment).

alter type public.pay_method add value if not exists 'momo';
alter type public.pay_method add value if not exists 'call';

-- The mobile-money account shown at checkout. Edited in Admin → Settings.
alter table public.settings
  add column if not exists momo_number text not null default '',
  add column if not exists momo_name   text not null default '';

-- The account customers pay into. The number is entered in Admin → Settings.
update public.settings set momo_name = 'Felix Sowah' where id = 1 and momo_name = '';
