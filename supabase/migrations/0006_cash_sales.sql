-- Casa del Vino — cash sales over the counter.
-- Run this whole file in the Supabase SQL editor after 0005.
--
-- When a customer pays cash in the shop, the admin presses "Cash" beside the
-- bottle (Admin → Products), enters how many were sold (and, if not today,
-- the day it was sold) and confirms. This function then, in one atomic step:
--   * takes the bottles out of stock (refusing if fewer are left, so two
--     admins on two devices can never oversell);
--   * records a paid, delivered order tagged "cash" at the bottle's current
--     price, dated when the cash was taken, so the sale counts in revenue
--     and shows in Admin → Orders like any other order.
-- Cancelling that order later puts the bottles back, like any order.

alter type public.pay_method add value if not exists 'cash';

create or replace function public.record_cash_sale(p_product_id text, p_qty int, p_sold_at timestamptz default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prod  public.products%rowtype;
  v_order public.orders%rowtype;
  v_at    timestamptz := coalesce(p_sold_at, now());
begin
  if not public.is_admin() then
    raise exception 'Only an admin can record a cash sale';
  end if;
  if p_qty is null or p_qty <= 0 then
    raise exception 'Enter how many bottles were sold';
  end if;
  if v_at > now() + interval '1 hour' then
    raise exception 'The sale date cannot be in the future';
  end if;

  select * into v_prod from public.products where products.id = p_product_id for update;
  if not found then
    raise exception 'That bottle is no longer in the cellar';
  end if;
  if v_prod.stock < p_qty then
    raise exception 'Only % left of %', v_prod.stock, v_prod.name;
  end if;

  insert into public.orders (
    user_id, customer_name, email, phone, address, city,
    ship_method, pay_method, subtotal_cents, ship_cents, total_cents, item_count,
    status, payment_status, created_at
  ) values (
    null, 'Walk-in customer', '', '', '', '',
    'pickup', 'cash', v_prod.price_cents * p_qty, 0, v_prod.price_cents * p_qty, p_qty,
    'delivered', 'paid', v_at
  )
  returning * into v_order;

  insert into public.order_items (order_id, product_id, name, unit_price_cents, qty)
  values (v_order.id, v_prod.id, v_prod.name, v_prod.price_cents, p_qty);

  update public.products
     set stock = stock - p_qty, updated_at = now()
   where products.id = v_prod.id
  returning * into v_prod;

  return jsonb_build_object(
    'order_id',    v_order.id,
    'order_no',    v_order.order_no,
    'total_cents', v_order.total_cents,
    'sold_at',     v_order.created_at,
    'stock',       v_prod.stock
  );
end;
$$;

revoke all on function public.record_cash_sale(text, int, timestamptz) from public;
grant execute on function public.record_cash_sale(text, int, timestamptz) to authenticated;

-- No confirmation or "new order" email for a sale the admin just rang up
-- themselves: the trigger from 0005 now only fires for orders with a
-- customer email, which every checkout order has and cash sales never do.
drop trigger if exists orders_notify_placed on public.orders;
create constraint trigger orders_notify_placed
  after insert on public.orders
  deferrable initially deferred
  for each row
  when (new.email <> '')
  execute function public.notify_order_placed();
