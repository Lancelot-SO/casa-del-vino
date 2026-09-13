// Marks orders paid when Stripe Checkout completes, and cancels them (which
// restocks the bottles) when a session expires unpaid.
//
// Secrets needed:  STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET  (SUPABASE_* are injected)
// Deploy:          supabase functions deploy stripe-webhook --no-verify-jwt
// Stripe endpoint: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
// Events:          checkout.session.completed, checkout.session.expired

import Stripe from 'https://esm.sh/stripe@14?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2023-10-16' });
  const signature = req.headers.get('stripe-signature') ?? '';
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '');
  } catch (e) {
    return new Response(`Webhook signature failed: ${e instanceof Error ? e.message : e}`, { status: 400 });
  }

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.order_id;

  if (orderId) {
    if (event.type === 'checkout.session.completed' && session.payment_status === 'paid') {
      await db.from('orders').update({ payment_status: 'paid', status: 'confirmed' }).eq('id', orderId);
    } else if (event.type === 'checkout.session.expired') {
      await db.from('orders').update({ status: 'cancelled' }).eq('id', orderId).eq('payment_status', 'unpaid');
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
