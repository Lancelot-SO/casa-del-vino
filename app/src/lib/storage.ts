/**
 * The only things still kept in the browser: a guest's bag and wishlist
 * (signed-in customers have theirs in the database), the guest flag and the
 * age-gate answer.
 */

export const KEYS = {
  cart: 'cdv-cart',
  wish: 'cdv-wish',
  guest: 'cdv-guest',
  adult: 'cdv-adult',
} as const;

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function persist(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or quota — the value just does not survive a reload */
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* see persist */
  }
}
