import type { CSSProperties, ReactNode } from 'react';
import { useLayout, useStore } from '../store/store';
import { Btn, Input, Textarea } from '../components/ui/Hoverable';
import { Icon } from '../components/ui/Icon';

const fieldStyle: CSSProperties = {
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

const labelStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, opacity: 0.85 };
const focusRed: CSSProperties = { borderColor: '#c22b45' };

const bubble: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: '#262322',
  display: 'grid',
  placeItems: 'center',
  color: '#c22b45',
  flex: 'none',
};

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={bubble}>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 11, opacity: 0.55 }}>{label}</span>
        <span style={{ fontSize: 14 }}>{value}</span>
      </span>
    </div>
  );
}

export function ContactPage() {
  const { state, set, settings } = useStore();
  const L = useLayout();

  return (
    <section
      style={{
        animation: 'cdvRise .8s cubic-bezier(.2,.8,.2,1) both',
        background: 'linear-gradient(135deg,#1c1917 0%,#141211 60%,#200a0f 100%)',
        borderRadius: L.radiusLg,
        padding: L.panelPad,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))',
        gap: 32,
        boxShadow: '0 20px 60px rgba(0,0,0,.5)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <span style={{ fontSize: 12, color: '#c22b45' }}>Contact us</span>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontWeight: 500,
            fontSize: 'clamp(36px,4vw,54px)',
            lineHeight: 1.02,
            margin: 0,
            textWrap: 'pretty',
          }}
        >
          Let's talk
          <br />
          about wine.
        </h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, opacity: 0.75, maxWidth: '40ch', textWrap: 'pretty' }}>
          Orders, trade enquiries, tastings or a bottle you can't find in the cellar. We reply within one working day.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <a href={'mailto:' + settings.email} style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#f3ece2' }}>
            <span style={bubble}>
              <Icon>
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </Icon>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11, opacity: 0.55 }}>Email</span>
              <span style={{ fontSize: 14 }}>{settings.email}</span>
            </span>
          </a>
          <a href="https://wa.me/" style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#f3ece2' }}>
            <span style={bubble}>
              <Icon>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </Icon>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11, opacity: 0.55 }}>Phone / WhatsApp</span>
              <span style={{ fontSize: 14 }}>{settings.phone}</span>
            </span>
          </a>
          <Row
            icon={
              <Icon>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </Icon>
            }
            label="Hours"
            value={settings.hours}
          />
          <Row
            icon={
              <Icon>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </Icon>
            }
            label="Address"
            value={settings.address}
          />
        </div>
      </div>

      {state.sent ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 12,
            background: '#1a1817',
            borderRadius: 20,
            padding: 32,
          }}
        >
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#c22b45',
              color: '#fff4f5',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon size={22} strokeWidth={2.2}>
              <path d="M20 6 9 17l-5-5" />
            </Icon>
          </span>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 30, margin: 0 }}>Message sent</h2>
          <p style={{ margin: 0, opacity: 0.7, fontSize: 14 }}>Thank you. We'll be in touch within one working day.</p>
          <Btn
            onClick={() => set({ sent: false })}
            style={{
              alignSelf: 'flex-start',
              marginTop: 6,
              fontSize: 12,
              color: '#c22b45',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
            }}
          >
            Send another
          </Btn>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            set({ sent: true });
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#1a1817', borderRadius: 20, padding: 22 }}
        >
          <label style={labelStyle}>
            Name
            <Input required placeholder="Your name" style={fieldStyle} focusStyle={focusRed} />
          </label>
          <label style={labelStyle}>
            Email
            <Input required type="email" placeholder="you@example.com" style={fieldStyle} focusStyle={focusRed} />
          </label>
          <label style={labelStyle}>
            Subject
            <select style={fieldStyle} defaultValue="Order enquiry">
              <option>Order enquiry</option>
              <option>Trade / wholesale</option>
              <option>Tasting or event</option>
              <option>Request a bottle</option>
              <option>Other</option>
            </select>
          </label>
          <label style={labelStyle}>
            Message
            <Textarea
              required
              rows={5}
              placeholder="How can we help?"
              style={{ ...fieldStyle, height: 'auto', padding: '12px 14px', resize: 'vertical' }}
              focusStyle={focusRed}
            />
          </label>
          <button
            type="submit"
            style={{
              all: 'unset',
              cursor: 'pointer',
              marginTop: 6,
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
              boxShadow: '0 10px 30px rgba(194,43,69,.3)',
            }}
          >
            Send message
          </button>
        </form>
      )}
    </section>
  );
}
