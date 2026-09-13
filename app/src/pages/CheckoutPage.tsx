import type { CSSProperties, FormEvent } from 'react';
import { useCart } from '../store/selectors';
import { useLayout, useStore } from '../store/store';
import { eur } from '../lib/format';
import { Box, Btn, Input } from '../components/ui/Hoverable';
import { Icon, PathIcon } from '../components/ui/Icon';
import type { PayId, ShipId } from '../types';

const SHIP: { id: ShipId; label: string; note: string; cost: number }[] = [
  { id: 'standard', label: 'Standard', note: '3–5 working days', cost: 6.9 },
  { id: 'express', label: 'Express', note: 'Next working day', cost: 12.9 },
  { id: 'pickup', label: 'Collect in store', note: 'Ready in 2 hours', cost: 0 },
];

const PAY: { id: PayId; label: string; icon: string }[] = [
  { id: 'card', label: 'Card', icon: 'M2 5h20v14H2zM2 10h20M6 15h4' },
  {
    id: 'transfer',
    label: 'Bank transfer',
    icon: 'M3 21h18M3 10h18M5 6l7-3 7 3M6 10v11M18 10v11M10 10v11M14 10v11',
  },
  {
    id: 'cod',
    label: 'Pay on delivery',
    icon: 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14M17 18m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M7 18m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0',
  },
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

/** Bag → delivery → payment → confirmation, with a live summary alongside. */
export function CheckoutPage() {
  const { state, set, settings, saveOrder } = useStore();
  const L = useLayout();
  const { cartLines, cartCount, subtotalN, cartEmpty, inc, dec } = useCart();
  const { step, ship, pay, form, order } = state;

  const shipOpt = SHIP.find((o) => o.id === ship) || SHIP[0];
  const free = parseFloat(settings.freeShip) || 60;
  const shipCost = subtotalN >= free && shipOpt.id !== 'express' ? 0 : shipOpt.cost;
  const totalN = subtotalN + shipCost;

  const src = order ?? {
    lines: cartLines,
    total: totalN,
    count: cartCount,
    no: '',
    pay,
    ship: shipOpt.label,
  };

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

  const digits = (form.card || '').replace(/\D/g, '').slice(0, 16);
  const cardPreview = (digits.padEnd(16, '•').match(/.{1,4}/g) || []).join(' ');

  const placeOrder = (e: FormEvent) => {
    e.preventDefault();
    saveOrder({
      no: 'CDV-' + Math.floor(1000 + Math.random() * 9000),
      lines: cartLines.map((l) => ({ id: l.id, name: l.name, qty: l.qty, price: l.price })),
      total: totalN,
      subtotal: subtotalN,
      shipCost,
      count: cartCount,
      pay,
      ship: shipOpt.label,
      customer: form.name || state.user?.name || 'Guest',
      email: form.email,
      date: new Date().toISOString(),
    });
  };

  const goStep = (n: 1 | 2 | 3 | 4) => () => {
    if (n <= step || (n === 2 && cartLines.length)) set({ step: n });
  };

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
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      set({ page: 'shop' });
                    }}
                  >
                    Back to the cellar
                  </a>
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
                    <img src={l.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px', minWidth: 0 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, lineHeight: 1.1 }}>{l.name}</span>
                    <span style={{ fontSize: 12, opacity: 0.6 }}>
                      {l.category} · {l.country} · {l.abv} · {l.sizeLabel}
                    </span>
                    <span style={{ fontSize: 12, color: '#c22b45' }}>{l.unitPrice} each</span>
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
                      style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center' }}
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
                <Btn onClick={() => set({ page: 'shop' })} style={backLink} hoverStyle={{ color: '#c22b45' }}>
                  ← Continue shopping
                </Btn>
                <Btn
                  onClick={() => set({ step: 2 })}
                  disabled={cartEmpty}
                  style={{ ...primary, opacity: cartEmpty ? 0.45 : 1 }}
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
                set({ step: 3 });
              }}
              style={panelStyle}
            >
              <h1 style={panelTitle}>Delivery</h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                <label style={label}>
                  Full name
                  <Input
                    required
                    name="name"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="Your name"
                    style={field}
                    focusStyle={focusRed}
                  />
                </label>
                <label style={label}>
                  Email
                  <Input
                    required
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    placeholder="you@example.com"
                    style={field}
                    focusStyle={focusRed}
                  />
                </label>
                <label style={label}>
                  Phone
                  <Input
                    required
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="+34 …"
                    style={field}
                    focusStyle={focusRed}
                  />
                </label>
                <label style={label}>
                  City
                  <Input
                    required
                    name="city"
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                    placeholder="City"
                    style={field}
                    focusStyle={focusRed}
                  />
                </label>
              </div>
              <label style={label}>
                Street address
                <Input
                  required
                  name="address"
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Street, number, floor"
                  style={field}
                  focusStyle={focusRed}
                />
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 11, opacity: 0.85 }}>Delivery</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
                  {SHIP.map((o) => (
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
                        <span style={{ color: '#c22b45' }}>
                          {(subtotalN >= free && o.id !== 'express') || o.cost === 0 ? 'Free' : eur(o.cost)}
                        </span>
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
            <form onSubmit={placeOrder} style={panelStyle}>
              <h1 style={panelTitle}>Payment</h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
                {PAY.map((o) => (
                  <Btn
                    key={o.id}
                    onClick={() => set({ pay: o.id })}
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
                    {o.label}
                  </Btn>
                ))}
              </div>

              {pay === 'card' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
                    gap: 12,
                    perspective: '900px',
                  }}
                >
                  <Box
                    style={{
                      gridColumn: '1/-1',
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
                      <span
                        style={{ width: 36, height: 26, borderRadius: 6, background: 'linear-gradient(135deg,#e0c27a,#a67c2e)' }}
                      />
                    </div>
                    <span style={{ fontSize: 20, letterSpacing: '.18em', fontVariantNumeric: 'tabular-nums' }}>
                      {cardPreview}
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8 }}>
                      <span>{(form.cardName || 'NAME ON CARD').toUpperCase()}</span>
                      <span>{form.exp}</span>
                    </div>
                  </Box>
                  <label style={{ ...label, gridColumn: '1/-1' }}>
                    Card number
                    <Input
                      required
                      name="card"
                      value={form.card}
                      onChange={(e) => setField('card', e.target.value)}
                      inputMode="numeric"
                      maxLength={19}
                      placeholder="1234 5678 9012 3456"
                      style={field}
                      focusStyle={focusRed}
                    />
                  </label>
                  <label style={label}>
                    Name on card
                    <Input
                      required
                      name="cardName"
                      value={form.cardName}
                      onChange={(e) => setField('cardName', e.target.value)}
                      placeholder="As printed"
                      style={field}
                      focusStyle={focusRed}
                    />
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12, minWidth: 0 }}>
                    <label style={label}>
                      Expiry
                      <Input
                        required
                        name="exp"
                        value={form.exp}
                        onChange={(e) => setField('exp', e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        style={field}
                        focusStyle={focusRed}
                      />
                    </label>
                    <label style={label}>
                      CVC
                      <Input
                        required
                        name="cvc"
                        value={form.cvc}
                        onChange={(e) => setField('cvc', e.target.value)}
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="•••"
                        style={field}
                        focusStyle={focusRed}
                      />
                    </label>
                  </div>
                </div>
              )}

              {pay === 'transfer' && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    lineHeight: 1.7,
                    opacity: 0.75,
                    background: '#262322',
                    borderRadius: 14,
                    padding: '14px 16px',
                  }}
                >
                  Bank details are sent with your order confirmation. We ship once the transfer arrives, usually within 1–2
                  working days.
                </p>
              )}
              {pay === 'cod' && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    lineHeight: 1.7,
                    opacity: 0.75,
                    background: '#262322',
                    borderRadius: 14,
                    padding: '14px 16px',
                  }}
                >
                  Pay the courier in cash or by card when the order arrives. ID will be checked at the door.
                </p>
              )}

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
                <Btn onClick={() => set({ step: 2 })} style={backLink} hoverStyle={{ color: '#c22b45' }}>
                  ← Back to delivery
                </Btn>
                <button
                  type="submit"
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    ...primary,
                    height: 56,
                    padding: '0 32px',
                    gap: 10,
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(194,43,69,.3)',
                    position: 'relative',
                    overflow: 'hidden',
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
                  Pay {eur(totalN)}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
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
                Order {src.no}
              </span>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontWeight: 500,
                  fontSize: 'clamp(34px,4vw,50px)',
                  margin: 0,
                  lineHeight: 1.02,
                }}
              >
                Thank you, {(form.name || 'friend').split(' ')[0]}.
                <br />
                Your bottles are on their way.
              </h1>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, opacity: 0.75, maxWidth: '52ch', textWrap: 'pretty' }}>
                A confirmation has been sent to {form.email}. {order ? order.ship : shipOpt.label} to {form.address},{' '}
                {form.city}. Someone over 18 must sign for the delivery.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
                  gap: 10,
                  width: '100%',
                  marginTop: 6,
                }}
              >
                {[
                  ['Bottles', String(src.count)],
                  ['Paid', eur(src.total)],
                  ['Method', (PAY.find((o) => o.id === src.pay) || PAY[0]).label],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      background: '#1a1817',
                      borderRadius: 14,
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 11, opacity: 0.55 }}>{k}</span>
                    <span style={{ fontSize: 16 }}>{v}</span>
                  </div>
                ))}
              </div>
              <Btn
                onClick={() => set({ page: 'shop', step: 1, order: null })}
                style={{ ...primary, marginTop: 10 }}
                hoverStyle={{ filter: 'brightness(1.06)' }}
              >
                Back to the cellar
              </Btn>
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
          {(order ? order.lines : cartLines).map((l) => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
              <span style={{ opacity: 0.8, minWidth: 0 }}>
                {l.qty} × {l.name}
              </span>
              <span>{eur(l.price * l.qty)}</span>
            </div>
          ))}
          <div style={{ height: 1, background: 'rgba(243,236,226,.1)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.75 }}>
            <span>Subtotal</span>
            <span>{eur(order ? order.subtotal : subtotalN)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.75 }}>
            <span>{order ? order.ship : shipOpt.label}</span>
            <span>{(order ? order.shipCost : shipCost) === 0 ? 'Free' : eur(order ? order.shipCost : shipCost)}</span>
          </div>
          <div style={{ height: 1, background: 'rgba(243,236,226,.1)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13 }}>Total</span>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, color: '#c22b45' }}>
              {eur(order ? order.total : totalN)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, opacity: 0.55 }}>
            <Icon size={14}>
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            </Icon>
            Secure checkout · 18+ only
          </div>
        </aside>
      </section>
    </>
  );
}
