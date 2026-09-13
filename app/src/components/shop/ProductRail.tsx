import { useMemo, useState } from 'react';
import { useShopView } from '../../store/selectors';
import type { ProductView } from '../../store/selectors';
import { Icon } from '../ui/Icon';
import { BTN_RESET } from '../ui/Hoverable';

interface Drop {
  size: string;
  dx: string;
  dy: string;
  rot: string;
  anim: string;
}

/** Nine wine droplets arcing out of the neck when the cork pops. */
const DROPS: Drop[] = Array.from({ length: 9 }, (_, k) => {
  const a = ((-100 + k * 25) * Math.PI) / 180;
  const dist = 50 + (k % 3) * 22;
  return {
    size: 5 + (k % 3) * 3 + 'px',
    dx: Math.round(Math.cos(a) * dist) + 'px',
    dy: Math.round(Math.sin(a) * dist + 40) + 'px',
    rot: k * 40 + 'deg',
    anim: `cdvDrop ${0.7 + (k % 3) * 0.15}s cubic-bezier(.2,.6,.4,1) ${(0.4 + k * 0.03).toFixed(2)}s both`,
  };
});

function ProductCard({ p, index, onOpen }: { p: ProductView; index: number; onOpen: (id: string) => void }) {
  const [on, setOn] = useState(false);
  const riseDelay = useMemo(() => (0.1 + index * 0.08).toFixed(2) + 's', [index]);

  return (
    <div style={{ perspective: '800px', animation: `cdvRise .7s cubic-bezier(.2,.8,.2,1) ${riseDelay} both` }}>
      <button
        type="button"
        onClick={() => onOpen(p.id)}
        onMouseEnter={() => setOn(true)}
        onMouseLeave={() => setOn(false)}
        style={{
          ...BTN_RESET,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          background: '#1a1817',
          borderRadius: 20,
          overflow: 'hidden',
          fontFamily: 'inherit',
          color: '#f3ece2',
          border: '1px solid transparent',
          transformStyle: 'preserve-3d',
          transition: 'transform .45s cubic-bezier(.2,.8,.2,1), box-shadow .45s',
          transform: on
            ? 'translateY(-8px) rotateX(6deg) rotateY(-6deg) scale(1.03)'
            : 'translateY(0) rotateX(0) rotateY(0) scale(1)',
          boxShadow: on ? '0 26px 50px rgba(0,0,0,.6), 0 0 30px rgba(194,43,69,.35)' : '0 0 0 rgba(0,0,0,0)',
        }}
      >
        <div style={{ position: 'relative', aspectRatio: '1/1.1', background: '#0f0d0c', overflow: 'hidden', width: '100%' }}>
          <div style={{ position: 'absolute', inset: 0, perspective: '700px', transformStyle: 'preserve-3d' }}>
            {/* The bottle lifts off its shadow and keeps turning while hovered. */}
            <img
              src={p.img}
              alt={p.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                transformOrigin: '50% 80%',
                animation: on
                  ? 'cdvBottleRise 1.4s cubic-bezier(.3,.8,.3,1) both, cdvBottleSpin 4s linear 1.4s infinite'
                  : 'none',
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '8%',
              width: '70%',
              height: 12,
              marginLeft: '-35%',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(0,0,0,.7), transparent 70%)',
              animation: on ? 'cdvShadowShrink .5s ease-out both' : 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '14%',
              width: 14,
              height: 22,
              marginLeft: -7,
              borderRadius: '5px 5px 3px 3px',
              background: 'linear-gradient(180deg,#d9b27a,#8a6234)',
              boxShadow: '0 2px 6px rgba(0,0,0,.6)',
              opacity: 0,
              animation: on ? 'cdvCork .9s cubic-bezier(.2,.7,.3,1) .35s both' : 'none',
            }}
          />
          {on &&
            DROPS.map((d, k) => (
              <div
                key={k}
                style={
                  {
                    position: 'absolute',
                    left: '50%',
                    top: '16%',
                    width: d.size,
                    height: d.size,
                    borderRadius: '50% 50% 50% 0',
                    background: '#c22b45',
                    boxShadow: '0 0 8px rgba(194,43,69,.8)',
                    opacity: 0,
                    '--dx': d.dx,
                    '--dy': d.dy,
                    '--rot': d.rot,
                    animation: d.anim,
                  } as React.CSSProperties
                }
              />
            ))}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '16%',
              width: 40,
              height: 40,
              margin: '-20px 0 0 -20px',
              borderRadius: '50%',
              border: '2px solid rgba(224,82,107,.85)',
              opacity: 0,
              animation: on ? 'cdvRing .8s ease-out .4s both' : 'none',
            }}
          />
        </div>
        <div
          style={{
            padding: '12px 14px 14px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12, lineHeight: 1.3 }}>{p.name}</span>
            <span style={{ fontSize: 12, color: '#c22b45' }}>
              {p.priceLabel} · {p.abv}
            </span>
          </div>
          <span style={{ color: p.saved ? '#c22b45' : 'rgba(243,236,226,.6)' }}>
            <Icon size={15} fill={p.saved ? '#c22b45' : 'none'}>
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </Icon>
          </span>
        </div>
      </button>
    </div>
  );
}

/** The rest of the shelf, under the featured bottle. */
export function ProductRail() {
  const { rail, openProduct } = useShopView();

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        animation: 'cdvRise .8s cubic-bezier(.2,.8,.2,1) .15s both',
      }}
    >
      <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 24, margin: 0, padding: '0 4px' }}>
        {rail.length ? 'You may also like' : 'That is the whole shelf'}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,140px),1fr))', gap: 14 }}>
        {rail.map((p, i) => (
          <ProductCard key={p.id} p={p} index={i} onOpen={openProduct} />
        ))}
      </div>
    </section>
  );
}
