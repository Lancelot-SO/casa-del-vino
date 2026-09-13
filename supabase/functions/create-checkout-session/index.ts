// Creates the order through place_order() (so totals and stock are decided in
// the database) and opens a Stripe Checkout session for it.
//
// Secrets needed:  STRIPE_SECRET_KEY, SITE_URL  (SUPABASE_* are injected)
// Deploy:          supabase functions deploy create-checkout-session

import Stripe from 'https://esm.sh/stripe@14?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Payload {
  items: { product_id: string; qty: number }[];
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  ship: 'standard' | 'express' | 'pickup';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2023-10-16' });
    const siteUrl = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // The caller's own session (or none, for a guest) so auth.uid() is set in place_order.
    const asCaller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const asService = createClient(supabaseUrl, serviceKey);

    const body = (await req.json()) as Payload;

    const { data: order, error } = await asCaller.rpc('place_order', {
      p_items: body.items,
      p_customer_name: body.customer_name,
      p_email: body.email,
      p_phone: body.phone ?? '',
      p_address: body.address ?? '',
      p_city: body.city ?? '',
      p_ship: body.ship,
      p_pay: 'card',
    });
    if (error) throw new Error(error.message);

    const { data: lines, error: linesErr } = await asService
      .from('order_items')
      .select('name, unit_price_cents, qty')
      .eq('order_id', order.id);
    if (linesErr) throw new Error(linesErr.message);

    const line_items = (lines ?? []).map((l) => ({
      quantity: l.qty,
      price_data: { currency: 'eur', unit_amount: l.unit_price_cents, product_data: { name: l.name } },
    }));
    if (order.ship_cents > 0) {
      line_items.push({
        quantity: 1,
        price_data: { currency: 'eur', unit_amount: order.ship_cents, product_data: { name: 'Delivery' } },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: body.email,
      metadata: { order_id: order.id, order_no: order.order_no },
      success_url: `${siteUrl}/checkout/success?order=${encodeURIComponent(order.order_no)}`,
      cancel_url: `${siteUrl}/checkout?cancelled=${encodeURIComponent(order.order_no)}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    await asService.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);

    return new Response(JSON.stringify({ url: session.url, order_no: order.order_no }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not start payment';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
