import { eur, fmtDate } from '../../lib/format';
import { useLayout, useStore } from '../../store/store';
import { rowDivider } from './shared';
import type { PayId } from '../../types';

const PAY_LABEL: Record<PayId, string> = { card: 'Card', transfer: 'Transfer', cod: 'On delivery' };

export function OrdersTab() {
  const { state } = useStore();
  const L = useLayout();
  const orders = state.orders;

  return (
    <section
      style={{
        background: 'linear-gradient(160deg,#241012,#160a0c)',
        color: '#f3ece2',
        border: '1px solid rgba(243,236,226,.08)',
        borderRadius: 24,
        padding: L.panelPad,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        animation: 'cdvRise .5s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <span style={{ fontSize: 18, fontWeight: 600 }}>Orders · {orders.length}</span>
      {orders.length === 0 && <span style={{ fontSize: 13, opacity: 0.6 }}>No orders yet.</span>}
      {orders.map((o) => (
        <div
          key={o.no}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px 16px',
            padding: '12px 0',
            ...rowDivider,
            fontSize: 13,
          }}
        >
          <span style={{ fontWeight: 600, minWidth: 90 }}>{o.no}</span>
          <span style={{ flex: '1 1 160px', opacity: 0.75 }}>
            {o.customer} · {o.lines.map((l) => l.qty + '× ' + l.name).join(', ')}
          </span>
          <span style={{ opacity: 0.6 }}>
            {o.ship} · {PAY_LABEL[o.pay] || o.pay}
          </span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>{fmtDate(o.date)}</span>
          <span style={{ fontWeight: 600 }}>{eur(o.total)}</span>
        </div>
      ))}
    </section>
  );
}
