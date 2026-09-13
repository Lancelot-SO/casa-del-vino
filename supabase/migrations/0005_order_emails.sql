-- Casa del Vino — order emails.
-- Run this whole file in the Supabase SQL editor after 0004.
--
-- When an order is placed, the customer gets a confirmation (with the
-- mobile-money instructions) and the admin gets a "new order" email. The
-- in-app bell keeps working as before; this only adds email.
--
-- Emails are sent through Resend (https://resend.com) straight from Postgres
-- with pg_net, so no edge function or CLI is needed. Two secrets live in the
-- Supabase Vault — set them once, in the SQL editor:
--
--   select vault.create_secret('re_xxxxxxxxx', 'resend_api_key');
--   select vault.create_secret('Casa del Vino <orders@your-domain.com>', 'mail_from');
--
-- Until a domain is verified in Resend, use 'Casa del Vino <onboarding@resend.dev>'
-- as mail_from: it only delivers to the address that owns the Resend account,
-- which is enough to test. To change a secret later:
--
--   update vault.secrets set secret = 're_new' where name = 'resend_api_key';
--
-- If either secret is missing, no email is sent and the order still goes through.

create extension if not exists pg_net;

-- GH₵ 1,250.00 from pesewas.
create or replace function public.money_ghs(cents int)
returns text
language sql
immutable
as $$
  select 'GH₵ ' || to_char(coalesce(cents, 0) / 100.0, 'FM999,999,999,990.00');
$$;

create or replace function public.html_escape(s text)
returns text
language sql
immutable
as $$
  select replace(replace(replace(replace(coalesce(s, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;');
$$;

-- Queues one email through Resend. Never raises: a mail problem must not
-- undo an order.
create or replace function public.send_email(p_to text[], p_subject text, p_html text)
returns void
language plpgsql
security definer
set search_path = public, extensions, net, vault
as $$
declare
  v_key  text;
  v_from text;
begin
  select decrypted_secret into v_key  from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  select decrypted_secret into v_from from vault.decrypted_secrets where name = 'mail_from'      limit 1;
  if v_key is null or v_from is null or cardinality(p_to) = 0 then
    return;
  end if;

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body    := jsonb_build_object('from', v_from, 'to', to_jsonb(p_to), 'subject', p_subject, 'html', p_html),
    timeout_milliseconds := 8000
  );
exception when others then
  raise warning 'send_email failed: %', sqlerrm;
end;
$$;

revoke all on function public.send_email(text[], text, text) from public, anon, authenticated;

-- The bottles in an order as table rows.
create or replace function public.order_lines_html(p_order_id uuid)
returns text
language sql
stable
as $$
  select coalesce(string_agg(
    '<tr><td style="padding:6px 0">' || public.html_escape(name) || ' × ' || qty || '</td>' ||
    '<td style="padding:6px 0;text-align:right">' || public.money_ghs(unit_price_cents * qty) || '</td></tr>',
    '' order by name), '')
  from public.order_items where order_id = p_order_id;
$$;

-- Fires once per new order, at commit, so the items already exist.
create or replace function public.notify_order_placed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s          public.settings%rowtype;
  v_ref      text;
  v_pay      text;
  v_ship     text;
  v_lines    text;
  v_deliver  text;
  v_admins   text[];
  v_style    text := 'font-family:Georgia,serif;color:#1a1817;max-width:560px;margin:0 auto;padding:24px;line-height:1.6';
  v_box      text := 'background:#f6f1e8;border-radius:12px;padding:16px 18px;margin:16px 0';
begin
  select * into s from public.settings where id = 1;

  select string_agg(distinct name, ', ') into v_ref from public.order_items where order_id = new.id;
  v_lines := public.order_lines_html(new.id);

  v_ship := case new.ship_method
    when 'pickup'  then 'Collect in store at ' || public.html_escape(s.address)
    when 'express' then 'Express delivery'
    else 'Standard delivery' end;
  v_deliver := case when new.ship_method = 'pickup' then v_ship
    else v_ship || ' to ' || public.html_escape(new.address) || ', ' || public.html_escape(new.city) end;

  v_pay := case new.pay_method
    when 'momo' then
      '<div style="' || v_box || '"><b>How to pay</b><br>' ||
      'Send <b>' || public.money_ghs(new.total_cents) || '</b> by MTN Mobile Money or Telecel Cash to:<br>' ||
      '<table style="margin:8px 0;font-size:15px">' ||
      '<tr><td style="padding:3px 16px 3px 0;color:#6b625a">Number</td><td><b>' || public.html_escape(s.momo_number) || '</b></td></tr>' ||
      '<tr><td style="padding:3px 16px 3px 0;color:#6b625a">Account name</td><td><b>' || public.html_escape(s.momo_name) || '</b></td></tr>' ||
      '<tr><td style="padding:3px 16px 3px 0;color:#6b625a">Amount</td><td><b>' || public.money_ghs(new.total_cents) || '</b></td></tr>' ||
      '<tr><td style="padding:3px 16px 3px 0;color:#6b625a">Reference</td><td><b style="color:#c22b45">' || public.html_escape(v_ref) || '</b></td></tr>' ||
      '</table>' ||
      'Before you confirm, check that the name your network shows is <b>' || public.html_escape(s.momo_name) ||
      '</b>. If it is different, do not send. Use the product name as the reference. We ship as soon as the payment arrives.</div>'
    when 'call' then
      '<div style="' || v_box || '"><b>Next step</b><br>Call us on <b>' || public.html_escape(s.phone) ||
      '</b> (' || public.html_escape(s.hours) || ') and mention order <b>' || new.order_no ||
      '</b>. We will confirm the bottles and arrange payment and delivery.</div>'
    when 'card' then '<p>Your card payment is being confirmed.</p>'
    else '<p>Payment: ' || new.pay_method || '.</p>' end;

  -- Customer confirmation.
  perform public.send_email(
    array[new.email],
    'Your Casa del Vino order ' || new.order_no,
    '<div style="' || v_style || '">' ||
    '<h1 style="font-weight:500;font-size:28px;margin:0 0 4px">Thank you, ' || public.html_escape(split_part(new.customer_name, ' ', 1)) || '.</h1>' ||
    '<p style="margin:0 0 16px;color:#6b625a">Order <b>' || new.order_no || '</b> · ' || to_char(new.created_at, 'DD Mon YYYY, HH24:MI') || '</p>' ||
    '<table style="width:100%;border-collapse:collapse">' || v_lines ||
    '<tr><td style="padding:10px 0 4px;border-top:1px solid #e3dccf">Subtotal</td><td style="padding:10px 0 4px;border-top:1px solid #e3dccf;text-align:right">' || public.money_ghs(new.subtotal_cents) || '</td></tr>' ||
    '<tr><td style="padding:4px 0">Delivery</td><td style="padding:4px 0;text-align:right">' || case when new.ship_cents = 0 then 'Free' else public.money_ghs(new.ship_cents) end || '</td></tr>' ||
    '<tr><td style="padding:8px 0;font-size:18px"><b>Total</b></td><td style="padding:8px 0;text-align:right;font-size:18px;color:#c22b45"><b>' || public.money_ghs(new.total_cents) || '</b></td></tr>' ||
    '</table>' ||
    v_pay ||
    '<p><b>Delivery</b><br>' || v_deliver || '<br>' || public.html_escape(new.customer_name) || ' · ' || public.html_escape(new.phone) || '</p>' ||
    '<p style="color:#6b625a;font-size:13px">Someone over 18 must receive the order. Questions? Reply to this email or call ' || public.html_escape(s.phone) || '.</p>' ||
    '</div>'
  );

  -- Admin alert: the contact email in Settings plus every admin account.
  select array_agg(distinct e) into v_admins
  from (
    select lower(s.email) as e where coalesce(s.email, '') <> ''
    union
    select lower(email) from public.profiles where role = 'admin' and coalesce(email, '') <> ''
  ) t;

  perform public.send_email(
    coalesce(v_admins, '{}'),
    'New order ' || new.order_no || ' · ' || public.money_ghs(new.total_cents) || ' · ' || new.customer_name,
    '<div style="' || v_style || '">' ||
    '<h1 style="font-weight:500;font-size:26px;margin:0 0 4px">New order ' || new.order_no || '</h1>' ||
    '<p style="margin:0 0 16px;color:#6b625a">' || to_char(new.created_at, 'DD Mon YYYY, HH24:MI') || ' · ' ||
      case new.pay_method when 'momo' then 'Mobile money' when 'call' then 'Call to arrange' when 'card' then 'Card' when 'transfer' then 'Bank transfer' else 'Pay on delivery' end ||
      ' · ' || new.payment_status || '</p>' ||
    '<table style="width:100%;border-collapse:collapse">' || v_lines ||
    '<tr><td style="padding:8px 0;border-top:1px solid #e3dccf"><b>Total</b></td><td style="padding:8px 0;border-top:1px solid #e3dccf;text-align:right"><b>' || public.money_ghs(new.total_cents) || '</b></td></tr>' ||
    '</table>' ||
    '<div style="' || v_box || '"><b>' || public.html_escape(new.customer_name) || '</b><br>' ||
    public.html_escape(new.email) || '<br>' || public.html_escape(new.phone) || '<br>' || v_deliver || '</div>' ||
    case when new.pay_method = 'momo' then '<p>Expect a MoMo payment of <b>' || public.money_ghs(new.total_cents) || '</b> with reference <b>' || public.html_escape(v_ref) || '</b>. Mark it paid in Admin → Orders once it lands.</p>'
         when new.pay_method = 'call' then '<p>The customer will call to arrange payment.</p>' else '' end ||
    '</div>'
  );

  return null;
end;
$$;

drop trigger if exists orders_notify_placed on public.orders;
create constraint trigger orders_notify_placed
  after insert on public.orders
  deferrable initially deferred
  for each row execute function public.notify_order_placed();
