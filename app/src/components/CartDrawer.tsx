import { useCart } from '../store/selectors';
import { useLayout, useStore } from '../store/store';
import { eur } from '../lib/format';
import { Btn } from './ui/Hoverable';
import { Icon } from './ui/Icon';

/** The bag, sliding in from the right over the page. */
export function CartDrawer() {
  const { state, set } = useStore();
  const L = useLayout();
  const { cartLines, cartCount, subtotalN, cartEmpty, inc, dec, removeLine, clearCart } = useCart();

  if (!state.cartOpen) return null;

  const startCheckout = () =>
    state.user
      ? set({ page: 'checkout', cartOpen: false, step: 1, order: null })
      : set({ cartOpen: false, authOpen: true, authMode: 'signin', authNext: 'checkout' });

  return (
    <div
      onClick={() => set({ cartOpen: false })}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,.7)',
        display: 'flex',
        justifyContent: 'flex-end',
        padding: L.drawerPad,
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(400px,100%)',
          height: '100%',
          background: '#1a1817',
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,.7)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 22px',
            borderBottom: '1px solid rgba(243,236,226,.08)',
          }}
        >
          <h3 style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 26 }}>Your bag</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!cartEmpty && (
              <Btn
                onClick={clearCart}
                style={{
                  fontSize: 11,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(243,236,226,.6)',
                  padding: '8px 10px',
                  borderRadius: 999,
                }}
                hoverStyle={{ color: '#c22b45', background: 'rgba(194,43,69,.1)' }}
              >
                Clear all
              </Btn>
            )}
            <Btn
              onClick={() => set({ cartOpen: false })}
              aria-label="Close"
              style={{ width: 36, height: 36, borderRadius: '50%', background: '#262322', display: 'grid', placeItems: 'center' }}
            >
              <Icon strokeWidth={2}>
                <path d="M18 6 6 18M6 6l12 12" />
              </Icon>
            </Btn>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {cartEmpty && (
            <p style={{ padding: '24px 22px', margin: 0, opacity: 0.6, fontSize: 14 }}>
              Your bag is empty. Add a bottle from the cellar.
            </p>
          )}
          {cartLines.map((l) => (
            <div
              key={l.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr auto',
                gap: 12,
                padding: '14px 22px',
                borderBottom: '1px solid rgba(243,236,226,.08)',
                alignItems: 'center',
              }}
            >
              <div style={{ width: 56, height: 64, overflow: 'hidden', background: '#0f0d0c', borderRadius: 12 }}>
                <img src={l.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span style={{ fontSize: 13, lineHeight: 1.3 }}>{l.name}</span>
                <span style={{ fontSize: 12, color: '#c22b45' }}>
                  {l.abv} · {l.sizeLabel} · {l.lineTotal}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: '#262322', borderRadius: 999, padding: 2 }}>
                <Btn onClick={() => dec(l.id)} style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                  −
                </Btn>
                <span style={{ minWidth: 22, textAlign: 'center', fontSize: 13 }}>{l.qty}</span>
                <Btn onClick={() => inc(l.id)} style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                  +
                </Btn>
              </div>
              <Btn
                onClick={() => removeLine(l.id)}
                aria-label="Remove"
                style={{ gridColumn: 3, justifySelf: 'end', fontSize: 11, color: 'rgba(243,236,226,.5)', marginTop: -6 }}
                hoverStyle={{ color: '#c22b45' }}
              >
                Remove
              </Btn>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '18px 22px',
            borderTop: '1px solid rgba(243,236,226,.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.7 }}>
            <span>{cartCount} bottles</span>
            <span>
              Subtotal <b style={{ color: '#f3ece2' }}>{eur(subtotalN)}</b>
            </span>
          </div>
          <Btn
            disabled={cartEmpty}
            onClick={startCheckout}
            style={{
              height: 52,
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
              justifyContent: 'center',
              opacity: cartEmpty ? 0.45 : 1,
            }}
          >
            Checkout
          </Btn>
        </div>
      </aside>
    </div>
  );
}
