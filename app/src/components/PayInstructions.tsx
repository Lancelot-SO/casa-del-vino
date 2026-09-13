import type { CSSProperties } from 'react';
import { ghs } from '../lib/format';
import type { OrderLine, PayId, Settings } from '../types';

const box: CSSProperties = {
  background: '#262322',
  borderRadius: 14,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  fontSize: 13,
  lineHeight: 1.6,
};
const row: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' };
const key: CSSProperties = { opacity: 0.6, fontSize: 12 };
const val: CSSProperties = { fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' };
const hint: CSSProperties = { margin: 0, fontSize: 12, opacity: 0.7 };

/** The payment reference a customer quotes: the product name(s) in the order. */
export const payReference = (lines: Pick<OrderLine, 'name'>[]): string =>
  Array.from(new Set(lines.map((l) => l.name))).join(', ');

interface Props {
  pay: PayId;
  settings: Settings;
  total: number;
  lines: Pick<OrderLine, 'name'>[];
  /** Set once the order exists; the number is shown next to the reference. */
  orderNo?: string;
}

/**
 * How to pay until Paystack is connected: send MTN MoMo / Telecel Cash to the
 * shop's number (checking the name first) with the product name as reference,
 * or phone the shop and arrange it.
 */
export function PayInstructions({ pay, settings, total, lines, orderNo }: Props) {
  const reference = payReference(lines) || 'your order';

  if (pay === 'call') {
    return (
      <div style={box}>
        <span>
          Call us on{' '}
          <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} style={{ color: '#c22b45', fontWeight: 600 }}>
            {settings.phone}
          </a>{' '}
          {orderNo ? `and mention order ${orderNo}` : 'once you have placed the order'} — we will confirm the bottles, the
          delivery details and how you would like to pay.
        </span>
        <p style={hint}>Opening hours: {settings.hours}. The bottles are held for you while we talk.</p>
      </div>
    );
  }

  if (pay !== 'momo') return null;

  const hasAccount = settings.momoNumber.trim() !== '';
  return (
    <div style={box}>
      <span>
        Send <b>{ghs(total)}</b> by <b>MTN Mobile Money</b> or <b>Telecel Cash</b> to the number below.
      </span>
      {hasAccount ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(243,236,226,.08)', paddingTop: 10 }}>
          <div style={row}>
            <span style={key}>Number</span>
            <span style={{ ...val, fontSize: 16, letterSpacing: '.04em' }}>{settings.momoNumber}</span>
          </div>
          <div style={row}>
            <span style={key}>Account name</span>
            <span style={val}>{settings.momoName || '—'}</span>
          </div>
          <div style={row}>
            <span style={key}>Amount</span>
            <span style={val}>{ghs(total)}</span>
          </div>
          <div style={row}>
            <span style={key}>Reference</span>
            <span style={{ ...val, color: '#c22b45' }}>{reference}</span>
          </div>
        </div>
      ) : (
        <p style={{ ...hint, color: '#e0526b' }}>
          The mobile-money number is not set yet. Call {settings.phone} or email {settings.email} and we will send it to you.
        </p>
      )}
      <p style={hint}>
        <b style={{ opacity: 1 }}>Before you confirm the transfer</b>, check that the name your network shows is{' '}
        <b style={{ opacity: 1 }}>{settings.momoName || 'the account name above'}</b>. If it is different, do not send.
      </p>
      <p style={hint}>
        Use the <b style={{ opacity: 1 }}>product name</b> as the reference
        {orderNo ? ` (order ${orderNo})` : ''}. We ship as soon as the payment arrives. Prefer to talk? Call{' '}
        <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} style={{ color: '#c22b45' }}>
          {settings.phone}
        </a>
        .
      </p>
    </div>
  );
}
