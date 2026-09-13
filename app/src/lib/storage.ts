/**
 * The shop runs entirely on-device: accounts, catalog edits, orders and
 * settings live in localStorage under the `cdv-*` keys the design used.
 */

export const KEYS = {
  user: 'cdv-user',
  users: 'cdv-users',
  products: 'cdv-products',
  orders: 'cdv-orders',
  settings: 'cdv-settings',
  activity: 'cdv-activity',
  notifRead: 'cdv-notif-read',
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

export function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function persist(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode, quota, blocked storage — the session just stops surviving reloads */
  }
}

export function persistRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* see persist */
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* see persist */
  }
}
