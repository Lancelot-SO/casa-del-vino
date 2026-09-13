/** Prices print in Ghana cedis: GH₵ 1,250.00. */
export const ghs = (n: number | string | undefined): string =>
  'GH₵ ' +
  Number(n || 0)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** The database stores pesewas (hundredths of a cedi). */
export const fromCents = (cents: number | null | undefined): number => Math.round(Number(cents || 0)) / 100;
export const toCents = (cedis: number | string): number =>
  Math.round((parseFloat(String(cedis).replace(',', '.')) || 0) * 100);
export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });

export const fmtDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** A URL-safe id from a name: "Rioja Reserva 2019" → "rioja-reserva-2019". */
export const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'bottle';

export const errorMessage = (e: unknown, fallback = 'Something went wrong'): string =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : fallback;
