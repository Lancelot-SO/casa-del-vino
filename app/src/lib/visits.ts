/**
 * Visit tracking. Every storefront page a visitor opens is recorded as one
 * row in `page_views` (see supabase/migrations/0007_visits.sql), which
 * Admin → Dashboard → Visits sums up. Nothing personal is sent: a random
 * visitor id kept in this browser, a random id for this tab session, the
 * path, the site the session arrived from, and mobile/desktop.
 *
 * Optionally the same page views also go to Google Analytics 4 when
 * `VITE_GA_ID` (a G-XXXXXXX measurement id) is set.
 */
import { supabase, supabaseConfigured } from './supabase';

const VISITOR_KEY = 'cdv-visitor';
const SESSION_KEY = 'cdv-session';
const ENTRY_KEY = 'cdv-entry';

/** Crawlers, link-preview scrapers and automation: never counted. */
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|prerender|facebookexternalhit|whatsapp|telegram|preview|fetch|curl|wget|python|java\//i;

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

/** A stable id from storage, or a fresh one for this page load when storage is blocked. */
const memo: Record<string, string> = {};
function storedId(storage: () => Storage, key: string): string {
  if (memo[key]) return memo[key];
  let v = '';
  try {
    v = storage().getItem(key) || '';
    if (!v) {
      v = randomId();
      storage().setItem(key, v);
    }
  } catch {
    v = randomId();
  }
  memo[key] = v;
  return v;
}

/**
 * Where this session came from, decided once on the first page of the session:
 * a `utm_source` in the landing URL, else the referring site's host, else ''
 * (typed, bookmarked, or an app that hides the referrer, e.g. WhatsApp).
 */
function entrySource(): string {
  try {
    const known = sessionStorage.getItem(ENTRY_KEY);
    if (known != null) return known;
  } catch {
    /* fall through: decide it fresh */
  }
  let src = '';
  try {
    const utm = new URLSearchParams(location.search).get('utm_source');
    if (utm) src = utm.trim().toLowerCase().slice(0, 100);
    else if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (host && host !== location.hostname.replace(/^www\./, '')) src = host;
    }
  } catch {
    src = '';
  }
  try {
    sessionStorage.setItem(ENTRY_KEY, src);
  } catch {
    /* it just gets re-derived on the next page */
  }
  return src;
}

function isBot(): boolean {
  return typeof navigator === 'undefined' || navigator.webdriver === true || BOT.test(navigator.userAgent);
}

function device(): 'mobile' | 'desktop' {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

/** Load gtag.js once, if a measurement id is configured. */
export function initAnalytics(): void {
  if (!GA_ID || typeof document === 'undefined' || window.gtag || isBot()) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  // The app reports each route change itself (see trackPageView).
  window.gtag('config', GA_ID, { send_page_view: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

let lastKey = '';
let lastAt = 0;

/** Record one page view. Safe to call on every route change; repeats within a second are ignored. */
export function trackPageView(path: string): void {
  if (isBot()) return;
  if (path.startsWith('/admin')) return;
  const key = path;
  const now = Date.now();
  if (key === lastKey && now - lastAt < 1000) return;
  lastKey = key;
  lastAt = now;

  if (window.gtag && GA_ID) {
    window.gtag('event', 'page_view', { page_path: path, page_location: location.origin + path, page_title: document.title });
  }

  if (!supabaseConfigured) return;
  void supabase
    .from('page_views')
    .insert({
      path: path.slice(0, 200),
      referrer: entrySource().slice(0, 200),
      visitor: storedId(() => localStorage, VISITOR_KEY),
      session: storedId(() => sessionStorage, SESSION_KEY),
      device: device(),
    })
    .then(() => undefined, () => undefined);
}
