-- Casa del Vino — contact-form emails and the shop's mailbox.
-- Run this whole file in the Supabase SQL editor after 0007.
--
-- The shop's address is info@casadelvino.shop (the GoDaddy mailbox). From now on:
--   * every message sent through the Contact page is emailed there, with
--     Reply-To set to the sender, so answering is one click (it still lands
--     in Admin → Messages as before);
--   * "new order" alerts go there only — no longer also to every admin
--     account, whose sign-in addresses may not be real mailboxes;
--   * customer emails are sent from that address too, and replies to them
--     come back to it;
--   * the Contact page shows it (it is the settings row's email; change it
--     any time in Admin → Settings).
--
-- Resend: the domain casadelvino.shop is verified there, so mail_from can be
-- the real address. The API key is the one secret this file cannot set — if
-- it is not in the Vault yet, run once (with your key from resend.com → API keys):
--
--   select vault.create_secret('re_xxxxxxxxx', 'resend_api_key');

-- 1. The shop's address.
update public.settings set email = 'info@casadelvino.shop', updated_at = now() where id = 1;

-- 2. The sender. Creates the mail_from secret or updates it.
do $do$
begin
  if exists (select 1 from vault.secrets where name = 'mail_from') then
    perform vault.update_secret((select id from vault.secrets where name = 'mail_from' limit 1), 'Casa del Vino <info@casadelvino.shop>');
  else
    perform vault.create_secret('Casa del Vino <info@casadelvino.shop>', 'mail_from');
  end if;
end
$do$;

-- 3. send_email() learns an optional Reply-To. Same behaviour as before when
--    it is omitted; the 3-argument version is dropped so calls stay unambiguous.
drop function if exists public.send_email(text[], text, text);

create or replace function public.send_email(p_to text[], p_subject text, p_html text, p_reply_to text default null)
returns void
language plpgsql
security definer
set search_path = public, extensions, net, vault
as $$
declare
  v_key  text;
  v_from text;
  v_body jsonb;
begin
  select decrypted_secret into v_key  from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  select decrypted_secret into v_from from vault.decrypted_secrets where name = 'mail_from'      limit 1;
  if v_key is null or v_from is null or cardinality(p_to) = 0 then
    return;
  end if;

  v_body := jsonb_build_object('from', v_from, 'to', to_jsonb(p_to), 'subject', p_subject, 'html', p_html);
  if coalesce(p_reply_to, '') <> '' then
    v_body := v_body || jsonb_build_object('reply_to', p_reply_to);
  end if;

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body    := v_body,
    timeout_milliseconds := 8000
  );
exception when others then
  raise warning 'send_email failed: %', sqlerrm;
end;
$$;

revoke all on function public.send_email(text[], text, text, text) from public, anon, authenticated;

-- 4. Who gets admin mail: the address in Settings; only if that is empty,
--    every admin account.
create or replace function public.admin_recipients()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select case
    when coalesce((select email from public.settings where id = 1), '') <> ''
      then array[lower((select email from public.settings where id = 1))]
    else coalesce((select array_agg(distinct lower(email)) from public.profiles where role = 'admin' and coalesce(email, '') <> ''), '{}')
  end;
$$;

revoke all on function public.admin_recipients() from public, anon, authenticated;

-- 5. Contact-page messages are emailed to the shop.
create or replace function public.notify_contact_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_style text := 'font-family:Georgia,serif;color:#1a1817;max-width:560px;margin:0 auto;padding:24px;line-height:1.6';
  v_box   text := 'background:#f6f1e8;border-radius:12px;padding:16px 18px;margin:16px 0;white-space:pre-wrap';
begin
  perform public.send_email(
    public.admin_recipients(),
    'Message from ' || new.name || ': ' || new.subject,
    '<div style="' || v_style || '">' ||
    '<h1 style="font-weight:500;font-size:26px;margin:0 0 4px">' || public.html_escape(new.subject) || '</h1>' ||
    '<p style="margin:0 0 16px;color:#6b625a">From <b>' || public.html_escape(new.name) || '</b> &lt;' || public.html_escape(new.email) || '&gt; · ' ||
      to_char(new.created_at, 'DD Mon YYYY, HH24:MI') || '</p>' ||
    '<div style="' || v_box || '">' || public.html_escape(new.message) || '</div>' ||
    '<p style="color:#6b625a;font-size:13px">Reply to this email to answer ' || public.html_escape(split_part(new.name, ' ', 1)) ||
      ' directly. The message is also in Admin → Messages.</p>' ||
    '</div>',
    nullif(new.email, '')
  );
  return null;
end;
$$;

drop trigger if exists contact_messages_notify on public.contact_messages;
create trigger contact_messages_notify
  after insert on public.contact_messages
  for each row execute function public.notify_contact_message();

-- 6. Order emails: admin alerts to the shop address only, and Reply-To set
--    (customer mail replies to the shop; the admin alert replies to the customer).
-- Same as 0005, with the two recipient changes above (the trigger from 0006 stays).
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
    '</div>',
    nullif(s.email, '')
  );

  -- Admin alert: the shop's contact address (Admin → Settings), else every admin account.
  v_admins := public.admin_recipients();

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
    '</div>',
    nullif(new.email, '')
  );

  return null;
end;
$$;
