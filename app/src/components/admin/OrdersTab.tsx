import { useState } from 'react';
import type { CSSProperties } from 'react';
import { PAY_LABEL, SHIP_LABEL, STATUS_LABEL } from '../../data/catalog';
import * as api from '../../lib/api';
import { errorMessage, ghs, fmtDateTime } from '../../lib/format';
import { useLayout, useStore } from '../../store/store';
import { Btn, Select } from '../ui/Hoverable';
import { rowDivider } from './shared';
import type { OrderStatus, PaymentStatus } from '../../types';

const select: CSSProperties = {
  height: 34,
  borderRadius: 10,
  background: 'rgba(243,236,226,.06)',
  border: '1px solid rgba(243,236,226,.15)',
  color: '#f3ece2',
  font: 'inherit',
  fontSize: 12,
  padding: '0 10px',
  outline: 0,
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#d9b27a',
  confirmed: '#e0526b',
  shipped: '#c22b45',
  delivered: '#8fbf8f',
  cancelled: 'rgba(243,236,226,.4)',
};

type Filter = 'all' | 'open' | OrderStatus;

export function OrdersTab() {
  const { state, loadAdminData, toast } = useStore();
  const L = useLayout();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const orders = state.orders.filter((o) =>
    filter === 'all' ? true : filter === 'open' ? o.status === 'pending' || o.status === 'confirmed' : o.status === filter,
  );

  const update = async (id: string, patch: { status?: OrderStatus; payment_status?: PaymentStatus }) => {
    setBusy(id);
    try {
      await api.updateOrder(id, patch);
      await loadAdminData();
      toast('Order updated');
    } catch (e) {
      toast(errorMessage(e, 'Could not update the order'));
    } finally {
      setBusy(null);
    }
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18, fontWeight: 600 }}>Orders · {orders.length}</span>
        <div className="cdv-noscrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {(['all', 'open', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as Filter[]).map((f) => (
            <Btn
              key={f}
              onClick={() => setFilter(f)}
              style={{ fontSize: 11, padding: '6px 12px', borderRadius: 999, border: `1px solid ${filter === f ? '#c22b45' : 'rgba(243,236,226,.15)'}`, background: filter === f ? 'rgba(194,43,69,.2)' : 'transparent', textTransform: 'capitalize', whiteSpace: 'nowrap' }}
              hoverStyle={{ borderColor: '#c22b45' }}
            >
              {f}
            </Btn>
          ))}
        </div>
      </div>

      {!state.adminLoaded && <span style={{ fontSize: 13, opacity: 0.6 }}>Loading…</span>}
      {state.adminLoaded && orders.length === 0 && <span style={{ fontSize: 13, opacity: 0.6 }}>No orders here.</span>}

      {orders.map((o) => {
        const isOpen = open === o.id;
        return (
          <div key={o.id} style={{ ...rowDivider, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, opacity: busy === o.id ? 0.6 : 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px' }}>
              <Btn onClick={() => setOpen(isOpen ? null : o.id)} style={{ fontWeight: 600, minWidth: 90, display: 'flex', alignItems: 'center', gap: 6 }} hoverStyle={{ color: '#c22b45' }}>
                <span style={{ display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', fontSize: 10 }}>▶</span>
                {o.no}
              </Btn>
              <span style={{ flex: '1 1 160px', opacity: 0.75, minWidth: 0 }}>
                {o.customer} · {o.lines.map((l) => l.qty + '× ' + l.name).join(', ')}
              </span>
              <span style={{ fontSize: 11, opacity: 0.6 }}>{fmtDateTime(o.date)}</span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(243,236,226,.08)', color: STATUS_COLOR[o.status] }}>
                {STATUS_LABEL[o.status]}
              </span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: o.paymentStatus === 'paid' ? 'rgba(143,191,143,.15)' : 'rgba(217,178,122,.15)' }}>
                {o.paymentStatus}
              </span>
              <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{ghs(o.total)}</span>
            </div>

            {isOpen && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: 14, padding: '6px 0 4px 18px', fontSize: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ opacity: 0.5, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>Customer</span>
                  <span>{o.customer}</span>
                  <span style={{ opacity: 0.7 }}>{o.email}</span>
                  {o.phone && <span style={{ opacity: 0.7 }}>{o.phone}</span>}
                  {!o.userId && <span style={{ opacity: 0.5 }}>Guest checkout</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ opacity: 0.5, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>Delivery</span>
                  <span>{SHIP_LABEL[o.ship]}</span>
                  {o.ship !== 'pickup' && (
                    <span style={{ opacity: 0.7 }}>
                      {o.address}, {o.city}
                    </span>
                  )}
                  <span style={{ opacity: 0.7 }}>
                    {PAY_LABEL[o.pay]} · subtotal {ghs(o.subtotal)} · shipping {o.shipCost ? ghs(o.shipCost) : 'free'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ opacity: 0.5, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>Update</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ minWidth: 60, opacity: 0.7 }}>Status</span>
                    <Select value={o.status} disabled={busy === o.id} onChange={(e) => void update(o.id, { status: e.target.value as OrderStatus })} style={select} focusStyle={{ borderColor: '#c22b45' }}>
                      {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ minWidth: 60, opacity: 0.7 }}>Payment</span>
                    <Select value={o.paymentStatus} disabled={busy === o.id} onChange={(e) => void update(o.id, { payment_status: e.target.value as PaymentStatus })} style={select} focusStyle={{ borderColor: '#c22b45' }}>
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </Select>
                  </label>
                  <span style={{ opacity: 0.5, fontSize: 11 }}>Cancelling puts the bottles back in stock.</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
