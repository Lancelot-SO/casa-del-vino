-- Casa del Vino — clearable admin notifications and customer account status.
-- Run this whole file in the Supabase SQL editor (or `supabase db push`)
-- after 0001_schema.sql and 0002_required_rows.sql.

-- ---------------------------------------------------------------------------
-- Account status: a customer is deactivated, never deleted. The row, their
-- orders and their history all stay; they simply cannot sign in or order.
-- ---------------------------------------------------------------------------
create type public.profile_status as enum ('active', 'inactive');

alter table public.profiles
  add column status public.profile_status not null default 'active';

create index profiles_status_idx on public.profiles (status);

-- Only an admin may change a role or a status (extends the 0001 guard).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an admin can change roles';
  end if;
  if new.status is distinct from old.status and not public.is_admin() then
    raise exception 'Only an admin can change an account status';
  end if;
  return new;
end;
$$;

-- True when the calling user has been deactivated.
create or replace function public.is_inactive()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'inactive');
$$;
grant execute on function public.is_inactive() to anon, authenticated;

-- A deactivated account cannot place an order, whatever the browser does.
create or replace function public.place_order(
  p_items         jsonb,
  p_customer_name text,
  p_email         text,
  p_phone         text,
  p_address       text,
  p_city          text,
  p_ship          public.ship_method,
  p_pay           public.pay_method
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_settings public.settings%rowtype;
  v_item     jsonb;
  v_prod     public.products%rowtype;
  v_qty      int;
  v_subtotal int := 0;
  v_count    int := 0;
  v_ship     int := 0;
  v_order    public.orders%rowtype;
begin
  if public.is_inactive() then
    raise exception 'This account has been deactivated. Please contact us.';
  end if;

  select * into v_settings from public.settings where settings.id = 1;
  if not found then
    raise exception 'Shop settings are missing';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your bag is empty';
  end if;
  if coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_email), '') = '' then
    raise exception 'Name and email are required';
  end if;
  if p_ship <> 'pickup' and (coalesce(trim(p_address), '') = '' or coalesce(trim(p_city), '') = '') then
    raise exception 'A delivery address is required';
  end if;

  -- Validate every line against the live catalog, locking the rows.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'qty')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity';
    end if;
    select * into v_prod
      from public.products
     where products.id = v_item ->> 'product_id' and products.active
       for update;
    if not found then
      raise exception 'A bottle in your bag is no longer available';
    end if;
    if v_prod.stock < v_qty then
      raise exception 'Only % left of %', v_prod.stock, v_prod.name;
    end if;
    v_subtotal := v_subtotal + v_prod.price_cents * v_qty;
    v_count := v_count + v_qty;
  end loop;

  v_ship := case p_ship
    when 'pickup'  then 0
    when 'express' then v_settings.express_ship_cents
    else case when v_subtotal >= v_settings.free_ship_cents then 0 else v_settings.standard_ship_cents end
  end;

  insert into public.orders (
    user_id, customer_name, email, phone, address, city,
    ship_method, pay_method, subtotal_cents, ship_cents, total_cents, item_count,
    status, payment_status
  ) values (
    auth.uid(), trim(p_customer_name), lower(trim(p_email)), coalesce(p_phone, ''), coalesce(p_address, ''), coalesce(p_city, ''),
    p_ship, p_pay, v_subtotal, v_ship, v_subtotal + v_ship, v_count,
    case p_pay when 'cod' then 'confirmed'::public.order_status else 'pending'::public.order_status end,
    'unpaid'
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'qty')::int;
    select * into v_prod from public.products where products.id = v_item ->> 'product_id';
    insert into public.order_items (order_id, product_id, name, unit_price_cents, qty)
    values (v_order.id, v_prod.id, v_prod.name, v_prod.price_cents, v_qty);
    update public.products set stock = stock - v_qty where products.id = v_prod.id;
  end loop;

  if auth.uid() is not null then
    delete from public.cart_items where cart_items.user_id = auth.uid();
  end if;

  return jsonb_build_object(
    'id',             v_order.id,
    'order_no',       v_order.order_no,
    'subtotal_cents', v_order.subtotal_cents,
    'ship_cents',     v_order.ship_cents,
    'total_cents',    v_order.total_cents,
    'item_count',     v_order.item_count,
    'status',         v_order.status,
    'payment_status', v_order.payment_status,
    'created_at',     v_order.created_at
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Clearable notifications. The bell is built from orders, sign-ups, messages
-- and catalog changes; "Clear all" hides everything up to a moment, and a
-- single item can be dismissed on its own.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column notifications_cleared_at timestamptz not null default 'epoch';

create table public.notification_dismissals (
  user_id    uuid not null references auth.users (id) on delete cascade,
  key        text not null,                 -- 'o-<order id>', 'u-<profile id>', 'm-<message id>', 'a-<activity id>'
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.notification_dismissals enable row level security;

create policy "dismissals: own rows" on public.notification_dismissals for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
