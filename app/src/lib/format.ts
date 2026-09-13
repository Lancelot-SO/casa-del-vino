/** Prices print in euros with a comma decimal, as in the design. */
export const eur = (n: number | string | undefined): string =>
  '€' + Number(n || 0).toFixed(2).replace('.', ',');

export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
