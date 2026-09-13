import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False when the .env is missing — the app then shows a setup notice instead of a blank shop. */
export const supabaseConfigured = Boolean(url && anonKey);

/** Card payments need the Stripe edge functions deployed; see SETUP.md. */
export const cardPaymentsEnabled = import.meta.env.VITE_CARD_PAYMENTS === 'on';

export const supabase = createClient(url || 'https://not-configured.supabase.co', anonKey || 'not-configured', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
