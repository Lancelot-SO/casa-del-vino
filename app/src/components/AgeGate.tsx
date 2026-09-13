import { useState } from 'react';
import { useStore } from '../store/store';
import { Btn } from './ui/Hoverable';
import { Icon } from './ui/Icon';

/** Alcohol may only be sold to adults: the cellar stays behind this until they confirm. */
export function AgeGate() {
  const { confirmAdult } = useStore();
  const [declined, setDeclined] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(5,2,2,.92)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        fontFamily: 'var(--font-body)',
        color: '#f3ece2',
      }}
    >
      <div
        style={{
          width: 'min(440px,100%)',
          borderRadius: 24,
          padding: '36px 32px',
          background: 'linear-gradient(160deg, rgba(30,24,24,.96), rgba(14,9,10,.98))',
          border: '1px solid rgba(243,236,226,.1)',
          boxShadow: '0 40px 100px rgba(0,0,0,.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          textAlign: 'center',
          animation: 'cdvRise .6s cubic-bezier(.2,.8,.2,1) both',
          boxSizing: 'border-box',
        }}
      >
        <img
          src="/assets/logo.jpg"
          alt=""
          style={{ width: 64, height: 64, objectFit: 'cover', objectPosition: 'center 58%', borderRadius: '50%', boxShadow: '0 0 30px rgba(194,43,69,.5)' }}
        />
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 32, margin: 0, lineHeight: 1.05 }}>
          Are you 18 or over?
        </h2>
        {declined ? (
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, opacity: 0.75 }}>
            Sorry, Casa del Vino sells alcohol and can only serve adults. Come back when you are of legal drinking age.
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, opacity: 0.75 }}>
            Casa del Vino sells wine and spirits. By entering you confirm you are of legal drinking age in your country.
          </p>
        )}
        {!declined && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
            <Btn
              onClick={confirmAdult}
              style={{
                height: 50,
                borderRadius: 12,
                background: 'linear-gradient(180deg,#c22b45,#7e1424)',
                color: '#fff4f5',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 10px 30px rgba(194,43,69,.35)',
              }}
              hoverStyle={{ filter: 'brightness(1.08)' }}
            >
              <Icon size={16} strokeWidth={2.2}>
                <path d="M20 6 9 17l-5-5" />
              </Icon>
              Yes, enter
            </Btn>
            <Btn
              onClick={() => setDeclined(true)}
              style={{
                height: 50,
                borderRadius: 12,
                border: '1px solid rgba(243,236,226,.2)',
                color: '#f3ece2',
                fontFamily: 'inherit',
                fontSize: 13,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
              }}
              hoverStyle={{ borderColor: '#c22b45' }}
            >
              No
            </Btn>
          </div>
        )}
        <span style={{ fontSize: 11, opacity: 0.45 }}>Drink responsibly.</span>
      </div>
    </div>
  );
}
