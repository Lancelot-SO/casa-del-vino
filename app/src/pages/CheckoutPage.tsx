import { useEffect } from 'react';
import { cdn } from '../lib/cloudinary';
import type { CSSProperties, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PAY_LABEL, SHIP_LABEL, SHIP_OPTIONS } from '../data/catalog';
import { useCart } from '../store/selectors';
import { routes, useLayout, useStore } from '../store/store';
import { ghs } from '../lib/format';
import { cardPaymentsEnabled } from '../lib/supabase';
import { Box, Btn, Input } from '../components/ui/Hoverable';
import { PayInstructions } from '../components/PayInstructions';
import { Icon, PathIcon } from '../components/ui/Icon';
import type { PayId } from '../types';

const PAY: { id: PayId; icon: string }[] = [
  {
    id: 'momo',
    icon: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 18h.01M9 6h6',
  },
  {
    id: 'call',
    icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.81.37 1.6.72 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.74-1.29a2 2 0 0 1 2.11-.45c.74.35 1.53.6 2.34.72A2 2 0 0 1 22 16.92z',
  },
  { id: 'card', icon: 'M2 5h20v14H2zM2 10h20M6 15h4' },
];

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
const primary: CSSProperties = {
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
};
const backLink: CSSProperties = {
  fontSize: 12,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: 'rgba(243,236,226,.7)',
};
const panelTitle: CSSProperties = {
  fontFamily: "'Cormorant Garamond',serif",
  fontWeight: 500,
  fontSize: 34,
  margin: 0,
  lineHeight: 1.05,
};
const note: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.7,
  opacity: 0.75,
  background: '#262322',
  borderRadius: 14,
  padding: '14px 16px',
};

/** Bag → delivery → payment → confirmation, with a live summary alongside. */
export function CheckoutPage() {
  const { state, set, go, settings, placeOrder, startCardPayment } = useStore();
  const L = useLayout();
  const [params] = useSearchParams();
  const { cartLines, cartCount, subtotalN, cartEmpty, overStock, inc, dec } = useCart();
  const { step, ship, pay, form, order, user, authReady, checkoutError, placing } = state;

  // Checkout asks you to sign in or continue as guest first.
  useEffect(() => {
    if (authReady && !user && !state.authOpen) {
      set({ authOpen: true, authMode: 'signin', authNext: 'checkout', authError: '', authNotice: '' });
    }
  }, [authReady, user, state.authOpen, set]);

  // Card is only offered once the payment provider is live; the rest is manual.
  useEffect(() => {
    if (!PAY.some((o) => o.id === pay) || (pay === 'card' && !cardPaymentsEnabled)) set({ pay: 'momo' });
  }, [pay, set]);

  const cancelledNo = params.get('cancelled');

  const shipCostOf = (id: typeof ship) =>
    id === 'pickup' ? 0 : id === 'express' ? settings.expressShip : subtotalN >= settings.freeShip ? 0 : settings.standardShip;
  const shipCost = shipCostOf(ship);
  const totalN = subtotalN + shipCost;

  const src = order ?? { lines: cartLines, total: totalN, count: cartCount, no: '', pay, ship };

  const panelStyle: CSSProperties = {
    background: '#1a1817',
    borderRadius: L.radiusLg,
    padding: L.panelPad,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    animation: 'cdvRise .6s cubic-bezier(.2,.8,.2,1) both',
  };

  const setField = (name: string, value: string) => set((s) => ({ form: { ...s.form, [name]: value } }));

  const submitPayment = (e: FormEvent) => {
    e.preventDefault();
    if (pay === 'card') void startCardPayment();
    else void placeOrder();
  };

  const goStep = (n: 1 | 2 | 3 | 4) => () => {
    if (step === 4) return;
    if (n <= step || (n === 2 && cartLines.length)) set({ step: n });
  };

  const payOptions = PAY.filter((o) => o.id !== 'card' || cardPaymentsEnabled);

  return (
    <>
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          flexWrap: 'wrap',
          animation: 'cdvRise .7s cubic-bezier(.2,.8,.2,1) both',
        }}
      >
        {([['Bag', 1], ['Delivery', 2], ['Payment', 3], ['Done', 4]] as const).map(([stepLabel, n]) => (
          <span key={n} style={{ display: 'contents' }}>
            <Btn
              onClick={goStep(n)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px 8px 8px',
                borderRadius: 999,
                fontFamily: 'inherit',
                fontSize: 12,
                color: n === step ? '#f3ece2' : n < step ? 'rgba(243,236,226,.8)' : 'rgba(243,236,226,.45)',
                background: n === step ? 'rgba(194,43,69,.12)' : 'transparent',
                transition: 'background .3s',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  background: n <= step ? '#c22b45' : '#262322',
                  color: n <= step ? '#fff4f5' : 'rgba(243,236,226,.6)',
                  transition: 'background .3s',
                }}
              >
                {n}
              </span>
              <span>{stepLabel}</span>
            </Btn>
            <span style={{ width: 28, height: 1, background: 'rgba(243,236,226,.15)', flex: 'none' }} />
          </span>
        ))}
      </section>

      {cancelledNo && step !== 4 && (
        <p style={{ ...note, borderLeft: '3px solid #c22b45' }}>
          The card payment for order {cancelledNo} was cancelled. Nothing was charged; the bottles are held for 30 minutes
          and then released. You can try again below.
        </p>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {step === 1 && (
            <section style={{ ...panelStyle, gap: 18 }}>
              <h1 style={panelTitle}>Your bag</h1>
              {cartEmpty && (
                <p style={{ margin: 0, opacity: 0.7 }}>
                  Your bag is empty.{' '}
                  <Btn onClick={() => go(routes.shop())} style={{ color: '#c22b45' }} hoverStyle={{ color: '#e0526b' }}>
                    Back to the cellar
                  </Btn>
                  .
                </p>
              )}
              {cartLines.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px 16px',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: '1px solid rgba(243,236,226,.08)',
                  }}
                >
                  <div style={{ width: 72, height: 84, borderRadius: 14, overflow: 'hidden', background: '#0f0d0c' }}>
                    <img src={cdn(l.img, 200)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px', minWidth: 0 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, lineHeight: 1.1 }}>{l.name}</span>
                    <span style={{ fontSize: 12, opacity: 0.6 }}>
                      {l.category} · {l.country} · {l.abv} · {l.sizeLabel}
                    </span>
                    <span style={{ fontSize: 12, color: '#c22b45' }}>{l.unitPrice} each</span>
                    {l.qty > l.stock && <span style={{ fontSize: 12, color: '#e0526b' }}>Only {l.stock} left on the shelf.</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#262322', borderRadius: 999, padding: 2 }}>
                    <Btn
                      onClick={() => dec(l.id)}
                      style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center' }}
                      hoverStyle={{ background: 'rgba(243,236,226,.08)' }}
                    >
                      −
                    </Btn>
                    <span style={{ minWidth: 24, textAlign: 'center', fontSize: 13 }}>{l.qty}</span>
                    <Btn
                      onClick={() => inc(l.id)}
                      style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', opacity: l.qty >= l.stock ? 0.35 : 1 }}
                      hoverStyle={{ background: 'rgba(243,236,226,.08)' }}
                    >
                      +
                    </Btn>
                  </div>
                  <span style={{ fontSize: 15, minWidth: 64, textAlign: 'right', marginLeft: 'auto' }}>{l.lineTotal}</span>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginTop: 6,
                }}
              >
                <Btn onClick={() => go(routes.shop())} style={backLink} hoverStyle={{ color: '#c22b45' }}>
                  ← Continue shopping
                </Btn>
                <Btn
                  onClick={() => set({ step: 2 })}
                  disabled={cartEmpty || overStock.length > 0}
                  style={{ ...primary, opacity: cartEmpty || overStock.length ? 0.45 : 1 }}
                  hoverStyle={{ filter: 'brightness(1.06)' }}
                >
                  Continue to delivery
                </Btn>
              </div>
            </section>
          )}

          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                set({ step: 3, checkoutError: '' });
              }}
              style={panelStyle}
            >
              <h1 style={panelTitle}>Delivery</h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                <label style={label}>
                  Full name
                  <Input required name="name" autoComplete="name" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Your name" style={field} focusStyle={focusRed} />
                </label>
                <label style={label}>
                  Email
                  <Input required type="email" name="email" autoComplete="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="you@example.com" style={field} focusStyle={focusRed} />
                </label>
                <label style={label}>
                  Phone
                  <Input required type="tel" name="phone" autoComplete="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+34 …" style={field} focusStyle={focusRed} />
                </label>
                <label style={label}>
                  City
                  <Input required={ship !== 'pickup'} name="city" autoComplete="address-level2" value={form.city} onChange={(e) => setField('city', e.target.value)} placeholder="City" style={field} focusStyle={focusRed} />
                </label>
              </div>
              <label style={label}>
                Street address
                <Input required={ship !== 'pickup'} name="address" autoComplete="street-address" value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="Street, number, floor" style={field} focusStyle={focusRed} />
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 11, opacity: 0.85 }}>Delivery</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
                  {SHIP_OPTIONS.map((o) => (
                    <Btn
                      key={o.id}
                      onClick={() => set({ ship: o.id })}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: '#262322',
                        border: `1px solid ${o.id === ship ? '#c22b45' : 'transparent'}`,
                        fontFamily: 'inherit',
                        transition: 'border-color .2s, transform .2s',
                        boxSizing: 'border-box',
                      }}
                      hoverStyle={{ transform: 'translateY(-2px)' }}
                    >
                      <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span>{o.label}</span>
                        <span style={{ color: '#c22b45' }}>{shipCostOf(o.id) === 0 ? 'Free' : ghs(shipCostOf(o.id))}</span>
                      </span>
                      <span style={{ fontSize: 11, opacity: 0.55 }}>{o.note}</span>
                    </Btn>
                  ))}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                <input
                  required
                  type="checkbox"
                  name="adult"
                  checked={form.adult}
                  onChange={(e) => set((s) => ({ form: { ...s.form, adult: e.target.checked } }))}
                  style={{ width: 18, height: 18, accentColor: '#c22b45' }}
                />
                I confirm I am of legal drinking age and someone 18+ will receive the order.
              </label>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                <Btn onClick={() => set({ step: 1 })} style={backLink} hoverStyle={{ color: '#c22b45' }}>
                  ← Back to bag
                </Btn>
                <button type="submit" style={{ all: 'unset', cursor: 'pointer', ...primary }}>
                  Continue to payment
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={submitPayment} style={panelStyle}>
              <h1 style={panelTitle}>Payment</h1>
              <p style={{ margin: '-6px 0 0', fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>
                Card payments are coming soon. For now, pay by mobile money or give us a call — your delivery details are
                already saved with the order.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
                {payOptions.map((o) => (
                  <Btn
                    key={o.id}
                    onClick={() => set({ pay: o.id, checkoutError: '' })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '14px 16px',
                      borderRadius: 14,
                      background: '#262322',
                      border: `1px solid ${o.id === pay ? '#c22b45' : 'transparent'}`,
                      fontFamily: 'inherit',
                      fontSize: 13,
                      transition: 'border-color .2s, transform .2s',
                      boxSizing: 'border-box',
                    }}
                    hoverStyle={{ transform: 'translateY(-2px)' }}
                  >
                    <PathIcon d={o.icon} size={18} stroke="#c22b45" />
                    {PAY_LABEL[o.id]}
                  </Btn>
                ))}
              </div>

              {pay === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, perspective: '900px' }}>
                  <Box
                    style={{
                      borderRadius: 18,
                      padding: 22,
                      background: 'linear-gradient(135deg,#6e0f20,#2a0a10 60%,#1a1817)',
                      border: '1px solid rgba(243,236,226,.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 18,
                      boxShadow: '0 20px 40px rgba(0,0,0,.5)',
                      transition: 'transform .5s',
                    }}
                    hoverStyle={{ transform: 'rotateY(-6deg) rotateX(4deg)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20 }}>Casa del Vino</span>
                      <span style={{ width: 36, height: 26, borderRadius: 6, background: 'linear-gradient(135deg,#e0c27a,#a67c2e)' }} />
                    </div>
                    <span style={{ fontSize: 20, letterSpacing: '.18em' }}>•••• •••• •••• ••••</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8 }}>
                      <span>{(form.name || 'NAME ON CARD').toUpperCase()}</span>
                      <span>{ghs(totalN)}</span>
                    </div>
                  </Box>
                  <p style={note}>
                    You will be taken to Stripe's secure page to enter your card. Your bottles are held while you pay.
                  </p>
                </div>
              )}
              {(pay === 'momo' || pay === 'call') && (
                <PayInstructions pay={pay} settings={settings} total={totalN} lines={cartLines} />
              )}

              {checkoutError && (
                <span style={{ fontSize: 13, color: '#e0526b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={14} strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </Icon>
                  {checkoutError}
                </span>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                <Btn onClick={() => set({ step: 2 })} style={backLink} hoverStyle={{ color: '#c22b45' }}>
                  ← Back to delivery
                </Btn>
                <button
                  type="submit"
                  disabled={placing || cartEmpty}
                  style={{
                    all: 'unset',
                    cursor: placing ? 'wait' : 'pointer',
                    ...primary,
                    height: 56,
                    padding: '0 32px',
                    gap: 10,
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(194,43,69,.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: placing || cartEmpty ? 0.6 : 1,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: '40%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent)',
                      animation: 'cdvShine 3.2s ease-in-out infinite',
                      pointerEvents: 'none',
                    }}
                  />
                  <Icon strokeWidth={2}>
                    <rect width="18" height="11" x="3" y="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </Icon>
                  {placing ? 'Placing order…' : pay === 'card' ? `Pay ${ghs(totalN)}` : `Place order · ${ghs(totalN)}`}
                </button>
              </div>
            </form>
          )}

          {step === 4 && order && (
            <section
              style={{
                background: 'linear-gradient(135deg,#1c1917 0%,#141211 60%,#200a0f 100%)',
                borderRadius: 28,
                padding: '40px 32px',
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
                Order {order.no}
              </span>
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 'clamp(34px,4vw,50px)', margin: 0, lineHeight: 1.02 }}>
                Thank you, {(order.customer || 'friend').split(' ')[0]}.
                <br />
                {order.pay === 'momo' || order.pay === 'transfer'
                  ? 'Your bottles are reserved.'
                  : order.pay === 'call'
                    ? 'We are waiting for your call.'
                    : 'Your bottles are on their way.'}
              </h1>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, opacity: 0.75, maxWidth: '52ch', textWrap: 'pretty' }}>
                {order.ship === 'pickup'
                  ? `We will email ${order.email} when the order is ready to collect at ${settings.address}.`
                  : `${SHIP_LABEL[order.ship]} delivery to ${order.address}, ${order.city}. Someone over 18 must sign for it.`}
              </p>
              {(order.pay === 'momo' || order.pay === 'call') && (
                <PayInstructions pay={order.pay} settings={settings} total={order.total} lines={order.lines} orderNo={order.no} />
              )}
              {order.pay === 'transfer' && (
                <p style={note}>
                  Please transfer {ghs(order.total)} quoting <b>{order.no}</b>. Contact {settings.email} for the bank details.
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, width: '100%', marginTop: 6 }}>
                {[
                  ['Bottles', String(order.count)],
                  ['Total', ghs(order.total)],
                  ['Method', PAY_LABEL[order.pay]],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: '#1a1817', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, opacity: 0.55 }}>{k}</span>
                    <span style={{ fontSize: 16 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                <Btn
                  onClick={() => {
                    set({ step: 1, order: null });
                    go(routes.shop());
                  }}
                  style={primary}
                  hoverStyle={{ filter: 'brightness(1.06)' }}
                >
                  Back to the cellar
                </Btn>
                {user && user.role !== 'guest' && (
                  <Btn
                    onClick={() => {
                      set({ step: 1, order: null });
                      go(routes.account);
                    }}
                    style={{ ...primary, background: '#1a1817', border: '1px solid rgba(243,236,226,.15)', boxSizing: 'border-box' }}
                    hoverStyle={{ borderColor: '#c22b45' }}
                  >
                    My orders
                  </Btn>
                )}
              </div>
            </section>
          )}
        </div>

        <aside
          style={{
            background: '#1a1817',
            borderRadius: 24,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            position: L.summaryPos,
            top: 20,
            animation: 'cdvRise .7s cubic-bezier(.2,.8,.2,1) .15s both',
          }}
        >
          <h3 style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 24 }}>Summary</h3>
          {src.lines.map((l, i) => (
            <div key={(l.id || '') + i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
              <span style={{ opacity: 0.8, minWidth: 0 }}>
                {l.qty} × {l.name}
              </span>
              <span>{ghs(l.price * l.qty)}</span>
            </div>
          ))}
          <div style={{ height: 1, background: 'rgba(243,236,226,.1)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.75 }}>
            <span>Subtotal</span>
            <span>{ghs(order ? order.subtotal : subtotalN)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.75 }}>
            <span>{SHIP_LABEL[order ? order.ship : ship]}</span>
            <span>{(order ? order.shipCost : shipCost) === 0 ? 'Free' : ghs(order ? order.shipCost : shipCost)}</span>
          </div>
          <div style={{ height: 1, background: 'rgba(243,236,226,.1)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13 }}>Total</span>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, color: '#c22b45' }}>
              {ghs(order ? order.total : totalN)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, opacity: 0.55 }}>
            <Icon size={14}>
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            </Icon>
            Secure checkout · 18+ only · prices in Ghana cedis
          </div>
        </aside>
      </section>
    </>
  );
}
