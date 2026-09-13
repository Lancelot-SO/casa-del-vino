import type { CSSProperties } from 'react';

/** The dark burgundy card every admin panel is built from. */
export const adminCard: CSSProperties = {
  background: 'linear-gradient(160deg,#241012,#160a0c)',
  color: '#f3ece2',
  border: '1px solid rgba(243,236,226,.08)',
  borderRadius: 24,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

export const cardHeader: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

export const cardTitle: CSSProperties = { fontSize: 16, fontWeight: 600 };

export const adminField: CSSProperties = {
  height: 44,
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  borderRadius: 12,
  background: 'rgba(243,236,226,.06)',
  border: '1px solid rgba(243,236,226,.15)',
  padding: '0 14px',
  color: '#f3ece2',
  font: 'inherit',
  fontSize: 14,
  outline: 0,
};

export const adminLabel: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 11,
  color: 'rgba(243,236,226,.7)',
};

export const focusRed: CSSProperties = { borderColor: '#c22b45' };

export const adminPrimary: CSSProperties = {
  height: 44,
  padding: '0 20px',
  borderRadius: 12,
  background: 'linear-gradient(180deg,#c22b45,#7e1424)',
  color: '#fff4f5',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxSizing: 'border-box',
};

export const adminGhost: CSSProperties = {
  height: 44,
  padding: '0 18px',
  borderRadius: 12,
  border: '1px solid rgba(243,236,226,.2)',
  color: '#f3ece2',
  fontFamily: 'inherit',
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
};

export const rowDivider: CSSProperties = { borderBottom: '1px solid rgba(243,236,226,.1)' };
