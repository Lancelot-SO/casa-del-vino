import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as api from '../lib/api';
import { ghs } from '../lib/format';
import { PAY_LABEL } from '../data/catalog';
import { routes, useLayout, useStore } from '../store/store';
import { Btn } from '../components/ui/Hoverable';
import { Icon } from '../components/ui/Icon';
import type { Order } from '../types';

/** Where Stripe sends the customer back after a card payment. */
export function CheckoutSuccessPage() {
  const { state, go, set } = useStore();
  const L = useLayout();
  const [params] = useSearchParams();
  const no = params.get('order') || '';
  const [order, setOrder] = useState<Order | null>(null);

  // The bag was emptied server-side by place_order; make the UI agree.
  useEffect(() => {
    set({ cart: {}, step: 1, order: null });
  }, [set]);

  useEffect(() => {
    if (!no || !state.authReady) return;
    api
      .findOrderByNo(no)
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [no, state.authReady, state.user?.id]);

  return (
    <section
      style={{
        background: 'linear-gradient(135deg,#1c1917 0%,#141211 60%,#200a0f 100%)',
        borderRadius: L.radiusLg,
        padding: L.panelPad,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        alignItems: 'flex-start',
        animation: 'cdvRise .7s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <span
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#c22b45',
          color: '#fff4f5',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 0 40px rgba(194,43,69,.6)',
          animation: 'cdvBreathe 3s ease-in-out infinite',
        }}
      >
        <Icon size={28} strokeWidth={2.2}>
          <path d="M20 6 9 17l-5-5" />
        </Icon>
      </span>
      <span style={{ fontSize: 12, color: '#c22b45', letterSpacing: '.12em', textTransform: 'uppercase' }}>
        {no ? `Order ${no}` : 'Payment received'}
      </span>
      <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 'clamp(34px,4vw,50px)', margin: 0, lineHeight: 1.02 }}>
        Thank you.
        <br />
        Your bottles are on their way.
      </h1>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, opacity: 0.75, maxWidth: '52ch', textWrap: 'pretty' }}>
        Your card payment went through. A confirmation is on its way to your inbox, and the order now shows in the cellar's
        books as paid.
      </p>
      {order && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, width: '100%', marginTop: 6 }}>
          {[
            ['Bottles', String(order.count)],
            ['Paid', ghs(order.total)],
            ['Method', PAY_LABEL[order.pay]],
          ].map(([k, v]) => (
            <div key={k} style={{ background: '#1a1817', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, opacity: 0.55 }}>{k}</span>
              <span style={{ fontSize: 16 }}>{v}</span>
            </div>
          ))}
        </div>
      )}
      <Btn
        onClick={() => go(routes.shop())}
        style={{
          marginTop: 10,
          height: 52,
          padding: '0 28px',
          borderRadius: 14,
          background: 'linear-gradient(180deg,#b8233d,#6e0f20)',
          color: '#fff4f5',
          fontFamily: 'inherit',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
        }}
        hoverStyle={{ filter: 'brightness(1.06)' }}
      >
        Back to the cellar
      </Btn>
    </section>
  );
}
