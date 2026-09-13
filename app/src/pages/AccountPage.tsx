import type { CSSProperties } from 'react';
import { useCart, useWishlist } from '../store/selectors';
import { useLayout, useStore } from '../store/store';
import { Btn } from '../components/ui/Hoverable';

const action: CSSProperties = {
  height: 50,
  padding: '0 20px',
  borderRadius: 14,
  background: '#262322',
  border: '1px solid rgba(243,236,226,.12)',
  color: '#f3ece2',
  fontFamily: 'inherit',
  fontSize: 13,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
};

export function AccountPage() {
  const { state, set, signOut } = useStore();
  const L = useLayout();
  const { cartCount } = useCart();
  const { count: wishCount } = useWishlist();
  const user = state.user;
  const label = user ? (user.role === 'guest' ? 'Guest' : (user.name || user.email).split(' ')[0]) : 'Sign in';

  return (
    <section
      style={{
        background: 'linear-gradient(135deg,#1c1917 0%,#141211 60%,#200a0f 100%)',
        borderRadius: L.radiusLg,
        padding: L.panelPad,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        animation: 'cdvRise .7s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <span style={{ fontSize: 12, color: '#c22b45' }}>Your account</span>
      <h1
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontWeight: 500,
          fontSize: 'clamp(32px,4vw,46px)',
          margin: 0,
          lineHeight: 1.05,
        }}
      >
        Hello, {label}.
      </h1>
      <p style={{ margin: 0, fontSize: 14, opacity: 0.75, maxWidth: '50ch', textWrap: 'pretty' }}>{user?.email}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
        <Btn onClick={() => set({ page: 'wishlist' })} style={action} hoverStyle={{ borderColor: '#c22b45' }}>
          Wishlist ({wishCount})
        </Btn>
        <Btn onClick={() => set({ cartOpen: true })} style={action} hoverStyle={{ borderColor: '#c22b45' }}>
          Bag ({cartCount})
        </Btn>
        <Btn onClick={signOut} style={action} hoverStyle={{ borderColor: '#c22b45' }}>
          Sign out
        </Btn>
      </div>
    </section>
  );
}
