-- Casa del Vino — schema, security and server-side order placement.
-- Run this whole file in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------
create type public.user_role      as enum ('admin', 'customer');
create type public.order_status   as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
create type public.payment_status as enum ('unpaid', 'paid', 'refunded');
create type public.ship_method    as enum ('standard', 'express', 'pickup');
create type public.pay_method     as enum ('card', 'transfer', 'cod');
create type public.activity_type  as enum ('product-added', 'product-updated', 'product-removed');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  email                 text not null,
  name                  text not null default '',
  role                  public.user_role not null default 'customer',
  phone                 text not null default '',
  address               text not null default '',
  city                  text not null default '',
  notifications_read_at timestamptz not null default 'epoch',
  created_at            timestamptz not null default now()
);

create table public.categories (
  id   text primary key,               -- slug, e.g. 'red-wine'
  name text not null unique,
  icon text not null default 'wine',   -- key into the sidebar icon map
  sort int  not null default 0
);

create table public.products (
  id           text primary key,       -- slug, e.g. 'syrah'
  name         text not null,
  category_id  text not null references public.categories (id),
  country      text not null default '',
  origin       text not null default '',
  size         text not null default '',
  abv          text not null default '',
  price_cents  int  not null check (price_cents >= 0),
  description  text not null default '',
  ingredients  text not null default '',
  stock        int  not null default 0 check (stock >= 0),
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  url        text not null,
  sort       int  not null default 0
);
create index product_images_product_idx on public.product_images (product_id, sort);

-- The floating ingredient medallions shown around the featured bottle.
create table public.product_ingredients (
  id         uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  label      text not null,
  article    text not null default '',   -- Wikipedia article used to find a photo
  icon       text not null default 'leaf',
  image_url  text,                       -- cached photo in storage, if any
  sort       int  not null default 0
);
create index product_ingredients_product_idx on public.product_ingredients (product_id, sort);

create table public.settings (
  id                  int primary key default 1 check (id = 1),
  email               text not null,
  phone               text not null,
  hours               text not null,
  address             text not null,
  free_ship_cents     int not null default 6000,
  standard_ship_cents int not null default 690,
  express_ship_cents  int not null default 1290,
  updated_at          timestamptz not null default now()
);

create sequence public.order_no_seq start 1001;

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_no          text not null unique default ('CDV-' || nextval('public.order_no_seq')),
  user_id           uuid references auth.users (id) on delete set null,
  customer_name     text not null,
  email             text not null,
  phone             text not null default '',
  address           text not null default '',
  city              text not null default '',
  ship_method       public.ship_method not null,
  pay_method        public.pay_method not null,
  subtotal_cents    int not null,
  ship_cents        int not null,
  total_cents       int not null,
  item_count        int not null,
  status            public.order_status not null default 'pending',
  payment_status    public.payment_status not null default 'unpaid',
  stripe_session_id text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_created_idx on public.orders (created_at desc);

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       text references public.products (id) on delete set null,
  name             text not null,
  unit_price_cents int  not null,
  qty              int  not null check (qty > 0)
);
create index order_items_order_idx on public.order_items (order_id);

create table public.cart_items (
  user_id    uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  qty        int  not null check (qty > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.wishlist_items (
  user_id    uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  type       public.activity_type not null,
  title      text not null,
  ref        text not null default '',
  actor      uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper functions and triggers
-- ---------------------------------------------------------------------------

-- True when the calling user has the admin role. SECURITY DEFINER so it can be
-- used inside policies on profiles itself without recursion.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- A profile row for every auth user. The shop's demo admin address is promoted
-- automatically; change or remove that line before going live.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    case when lower(coalesce(new.email, '')) = 'admin@casadelvino.com'
         then 'admin'::public.user_role
         else 'customer'::public.user_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only an admin may change a role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an admin can change roles';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- Cancelling an order puts its bottles back on the shelf.
create or replace function public.restock_on_cancel()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.products p
       set stock = p.stock + i.qty
      from public.order_items i
     where i.order_id = new.id and i.product_id = p.id;
  end if;
  return new;
end;
$$;

create trigger orders_restock_on_cancel
  after update of status on public.orders
  for each row execute function public.restock_on_cancel();

-- ---------------------------------------------------------------------------
-- place_order: the only way an order is created. Totals, shipping and stock
-- are decided here, never in the browser. Works for guests (auth.uid() null).
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_items         jsonb,             -- [{ "product_id": "syrah", "qty": 2 }, ...]
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
grant execute on function public.place_order(jsonb, text, text, text, text, text, public.ship_method, public.pay_method)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.product_images      enable row level security;
alter table public.product_ingredients enable row level security;
alter table public.settings            enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.cart_items          enable row level security;
alter table public.wishlist_items      enable row level security;
alter table public.contact_messages    enable row level security;
alter table public.activity_log        enable row level security;

-- profiles: you see and edit yourself; admins see and edit everyone.
create policy "profiles: read own or admin"   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own or admin" on public.profiles for update using (id = auth.uid() or public.is_admin());

-- catalog: public read, admin write.
create policy "categories: public read" on public.categories for select using (true);
create policy "categories: admin write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "products: public read active" on public.products for select using (active or public.is_admin());
create policy "products: admin write"        on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "product_images: public read" on public.product_images for select using (true);
create policy "product_images: admin write" on public.product_images for all using (public.is_admin()) with check (public.is_admin());

create policy "product_ingredients: public read" on public.product_ingredients for select using (true);
create policy "product_ingredients: admin write" on public.product_ingredients for all using (public.is_admin()) with check (public.is_admin());

create policy "settings: public read"  on public.settings for select using (true);
create policy "settings: admin update" on public.settings for update using (public.is_admin()) with check (public.is_admin());

-- orders: created only through place_order(); customers read their own.
create policy "orders: read own or admin" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders: admin update"      on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "orders: admin delete"      on public.orders for delete using (public.is_admin());

create policy "order_items: read via order" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- cart and wishlist: strictly per user.
create policy "cart: own rows" on public.cart_items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "wishlist: own rows" on public.wishlist_items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- contact form: anyone can send, only admins read.
create policy "contact: anyone can send" on public.contact_messages for insert with check (true);
create policy "contact: admin read"      on public.contact_messages for select using (public.is_admin());
create policy "contact: admin update"    on public.contact_messages for update using (public.is_admin()) with check (public.is_admin());
create policy "contact: admin delete"    on public.contact_messages for delete using (public.is_admin());

create policy "activity: admin read"  on public.activity_log for select using (public.is_admin());
create policy "activity: admin write" on public.activity_log for insert with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: product photos are public to read, admin-only to write.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product-images: public read" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "product-images: admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "product-images: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy "product-images: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
