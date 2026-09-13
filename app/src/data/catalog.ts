import type { PayId, ShipId } from '../types';

/**
 * Static tables the shop draws with. The catalog itself (bottles, shelves,
 * settings) lives in Supabase — see ../../supabase/migrations.
 */

/** Line icons drawn in a medallion when no ingredient photo is available. */
export const ING_ICON: Record<string, string> = {
  berry: 'M12 21a7 7 0 0 0 7-7c0-4-3-6-7-6s-7 2-7 6a7 7 0 0 0 7 7ZM12 8V4M12 4l3-2M12 4 9 2',
  plum: 'M12 21c5 0 8-3.5 8-8 0-4-3-7-8-7s-8 3-8 7c0 4.5 3 8 8 8ZM12 6c0-2 1-3 3-4',
  pepper: 'M8 9a4 4 0 1 1 8 0 4 4 0 1 1-8 0ZM6 16a3 3 0 1 0 6 0 3 3 0 1 0-6 0ZM15 17a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10ZM2 21c0-3 1.85-5.36 5.08-6',
  wine: 'M8 22h8M7 10h10M12 15v7M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z',
  sugar: 'M3 9l9-5 9 5-9 5-9-5ZM3 9v8l9 5 9-5V9M12 14v8',
  drop: 'M12 22a7 7 0 0 0 7-7c0-4-4-9-7-13-3 4-7 9-7 13a7 7 0 0 0 7 7Z',
  wheat: 'M12 22V8M12 8c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 8c3 0 5-2 5-5-3 0-5 2-5 5ZM12 14c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 14c3 0 5-2 5-5-3 0-5 2-5 5Z',
  barrel: 'M6 3h12c1 3 1.5 6 1.5 9s-.5 6-1.5 9H6c-1-3-1.5-6-1.5-9S5 6 6 3ZM4.5 9h15M4.5 15h15',
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 10m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
};

/** Category icons in the cellar sidebar, keyed by the `icon` column. */
export const ICON: Record<string, string> = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  wine: 'M8 22h8M7 10h10M12 15v7M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z',
  martini: 'M8 22h8M12 11v11M19 3l-7 8-7-8Z',
  glass: 'M15.2 22H8.8a2 2 0 0 1-2-1.79L5 3h14l-1.81 17.21A2 2 0 0 1 15.2 22ZM6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0',
  cream: 'M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v3M10 2v3M14 2v3',
  whisky: 'M6 3h12l-1 18H7ZM6 10h12',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10ZM2 21c0-3 1.85-5.36 5.08-6',
};

/** Guess a medallion icon from an ingredient name typed by the admin. */
export function guessIngredientIcon(label: string): string {
  const l = label.toLowerCase();
  if (/berry|cherry|currant|grape/.test(l)) return 'berry';
  if (/plum|fig|apple|pear|peach/.test(l)) return 'plum';
  if (/pepper|spice|clove|cinnamon/.test(l)) return 'pepper';
  if (/wine|brandy|whisk|rum|spirit|alcohol/.test(l)) return 'wine';
  if (/sugar|caramel|honey|syrup/.test(l)) return 'sugar';
  if (/water|cream|milk/.test(l)) return 'drop';
  if (/wheat|barley|grain|rye|corn|malt/.test(l)) return 'wheat';
  if (/oak|cask|barrel|wood/.test(l)) return 'barrel';
  if (/spain|italy|sweden|france|scotland|galicia|region/.test(l)) return 'pin';
  return 'leaf';
}

export const COUNTRIES = ['Spain', 'Italy', 'Sweden', 'France'];

export const SHIP_OPTIONS: { id: ShipId; label: string; note: string }[] = [
  { id: 'standard', label: 'Standard', note: '3–5 working days' },
  { id: 'express', label: 'Express', note: 'Next working day' },
  { id: 'pickup', label: 'Collect in store', note: 'Ready in 2 hours' },
];
export const SHIP_LABEL: Record<ShipId, string> = { standard: 'Standard', express: 'Express', pickup: 'Collect in store' };
export const PAY_LABEL: Record<PayId, string> = {
  momo: 'Mobile money',
  call: 'Call to arrange',
  card: 'Card',
  transfer: 'Bank transfer',
  cod: 'Pay on delivery',
};

export const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
} as const;

/** Entry splash and medallion count — the design canvas exposed these as tweaks. */
export const CONFIG = {
  showSplash: true,
  splashSeconds: 3,
  maxIngredients: 5,
};
