import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { PAY_LABEL, SHIP_LABEL, STATUS_LABEL } from '../data/catalog';
import { PayInstructions } from '../components/PayInstructions';
import { errorMessage, ghs, fmtDateTime } from '../lib/format';
import { useCart, useWishlist } from '../store/selectors';
import { routes, useLayout, useStore } from '../store/store';
import { Btn, Input } from '../components/ui/Hoverable';

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

const field: CSSProperties = {
  height: 46,
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  borderRadius: 12,
  background: '#262322',
  border: '1px solid rgba(243,236,226,.08)',
  padding: '0 14px',
  color: '#f3ece2',
  font: 'inherit',
  fontSize: 14,
  outline: 0,
};
const label: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, opacity: 0.85 };
const focusRed: CSSProperties = { borderColor: '#c22b45' };

const STATUS_COLOR: Record<string, string> = {
  pending: '#d9b27a',
  confirmed: '#e0526b',
  shipped: '#c22b45',
  delivered: '#8fbf8f',
  cancelled: 'rgba(243,236,226,.4)',
};

export function AccountPage() {
  const { state, set, go, settings, signOut, saveMyDetails, loadMyOrders } = useStore();
  const L = useLayout();
  const { cartCount } = useCart();
  const { count: wishCount } = useWishlist();
  const user = state.user;
  const isMember = !!user && user.role !== 'guest';

  const [details, setDetails] = useState({ name: '', phone: '', address: '', city: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) setDetails({ name: user.name, phone: user.phone, address: user.address, city: user.city });
  }, [user]);

  useEffect(() => {
    if (state.authReady && !user) set({ authOpen: true, authMode: 'signin', authNext: null });
  }, [state.authReady, user, set]);

  useEffect(() => {
    if (isMember && !state.myOrdersLoaded) void loadMyOrders();
  }, [isMember, state.myOrdersLoaded, loadMyOrders]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await saveMyDetails(details);
    } catch (err) {
      setError(errorMessage(err, 'Could not save'));
    } finally {
      setBusy(false);
    }
  };

  const heading = user ? (user.role === 'guest' ? 'Guest' : (user.name || user.email).split(' ')[0]) : 'there';

  return (
    <>
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
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 'clamp(32px,4vw,46px)', margin: 0, lineHeight: 1.05 }}>
          Hello, {heading}.
        </h1>
        {user?.email && <p style={{ margin: 0, fontSize: 14, opacity: 0.75 }}>{user.email}</p>}
        {user?.role === 'guest' && (
          <p style={{ margin: 0, fontSize: 14, opacity: 0.75, maxWidth: '50ch', textWrap: 'pretty' }}>
            You are browsing as a guest. Create an account to keep your wishlist and follow your orders.
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
          <Btn onClick={() => go(routes.wishlist)} style={action} hoverStyle={{ borderColor: '#c22b45' }}>
            Wishlist ({wishCount})
          </Btn>
          <Btn onClick={() => set({ cartOpen: true })} style={action} hoverStyle={{ borderColor: '#c22b45' }}>
            Bag ({cartCount})
          </Btn>
          {user?.role === 'guest' ? (
            <Btn onClick={() => set({ authOpen: true, authMode: 'signup', authNext: null })} style={action} hoverStyle={{ borderColor: '#c22b45' }}>
              Create account
            </Btn>
          ) : null}
          <Btn onClick={() => void signOut()} style={action} hoverStyle={{ borderColor: '#c22b45' }}>
            Sign out
          </Btn>
        </div>
      </section>

      {isMember && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 20, alignItems: 'start' }}>
          <form
            onSubmit={save}
            style={{ background: '#1a1817', borderRadius: 24, padding: 22, display: 'flex', flexDirection: 'column', gap: 12, animation: 'cdvRise .7s cubic-bezier(.2,.8,.2,1) .1s both' }}
          >
            <h3 style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 24 }}>Delivery details</h3>
            <span style={{ fontSize: 12, opacity: 0.6 }}>Pre-filled at checkout.</span>
            <label style={label}>
              Name
              <Input required value={details.name} autoComplete="name" onChange={(e) => setDetails({ ...details, name: e.target.value })} style={field} focusStyle={focusRed} />
            </label>
            <label style={label}>
              Phone
              <Input value={details.phone} autoComplete="tel" onChange={(e) => setDetails({ ...details, phone: e.target.value })} style={field} focusStyle={focusRed} />
            </label>
            <label style={label}>
              Street address
              <Input value={details.address} autoComplete="street-address" onChange={(e) => setDetails({ ...details, address: e.target.value })} style={field} focusStyle={focusRed} />
            </label>
            <label style={label}>
              City
              <Input value={details.city} autoComplete="address-level2" onChange={(e) => setDetails({ ...details, city: e.target.value })} style={field} focusStyle={focusRed} />
            </label>
            {error && <span style={{ fontSize: 12, color: '#e0526b' }}>{error}</span>}
            <button
              type="submit"
              disabled={busy}
              style={{ all: 'unset', cursor: 'pointer', ...action, background: 'linear-gradient(180deg,#b8233d,#6e0f20)', border: 0, color: '#fff4f5', fontWeight: 600, opacity: busy ? 0.6 : 1 }}
            >
              {busy ? 'Saving…' : 'Save details'}
            </button>
          </form>

          <div style={{ background: '#1a1817', borderRadius: 24, padding: 22, display: 'flex', flexDirection: 'column', gap: 12, animation: 'cdvRise .7s cubic-bezier(.2,.8,.2,1) .2s both' }}>
            <h3 style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 24 }}>Your orders</h3>
            {!state.myOrdersLoaded && <span style={{ fontSize: 13, opacity: 0.6 }}>Loading…</span>}
            {state.myOrdersLoaded && state.myOrders.length === 0 && (
              <span style={{ fontSize: 13, opacity: 0.6 }}>No orders yet. Your first bottles will show here.</span>
            )}
            {state.myOrders.map((o) => (
              <div key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0', borderBottom: '1px solid rgba(243,236,226,.08)', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600 }}>{o.no}</span>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(243,236,226,.08)', color: STATUS_COLOR[o.status] }}>
                    {STATUS_LABEL[o.status]}
                    {o.paymentStatus === 'paid' ? ' · paid' : o.status !== 'cancelled' ? ' · unpaid' : ''}
                  </span>
                </div>
                <span style={{ opacity: 0.7 }}>{o.lines.map((l) => l.qty + '× ' + l.name).join(', ')}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', fontSize: 12, opacity: 0.6 }}>
                  <span>
                    {fmtDateTime(o.date)} · {SHIP_LABEL[o.ship]} · {PAY_LABEL[o.pay]}
                  </span>
                  <span style={{ color: '#f3ece2', opacity: 1, fontWeight: 600 }}>{ghs(o.total)}</span>
                </div>
                {(o.pay === 'momo' || o.pay === 'call') && o.paymentStatus === 'unpaid' && o.status !== 'cancelled' && (
                  <PayInstructions pay={o.pay} settings={settings} total={o.total} lines={o.lines} orderNo={o.no} />
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
