import type { CSSProperties, MouseEvent } from 'react';
import { useChips, useShopView } from '../../store/selectors';
import { useLayout, useStore } from '../../store/store';
import { Btn } from '../ui/Hoverable';
import { Icon, PathIcon } from '../ui/Icon';

const chipTag: CSSProperties = { padding: '8px 14px', borderRadius: 12, background: '#262322', fontSize: 12 };

/**
 * The featured bottle: copy on the left, the photo on the right on a wine glow
 * with its ingredient medallions tumbling around it. The panel tilts in 3D
 * toward the cursor and a red light tracks it.
 */
export function FeaturedPanel() {
  const { state, set } = useStore();
  const L = useLayout();
  const { featured, featuredRaw, featuredImg, gallery, galleryIdx, toggleWish } = useShopView();
  const chips = useChips(featuredRaw);
  const tilt = state.tilt;

  if (!featured || !featuredRaw) return null;

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    set({
      tilt: {
        x: +((0.5 - py) * 10).toFixed(2),
        y: +((px - 0.5) * 12).toFixed(2),
        gx: Math.round(px * 100),
        gy: Math.round(py * 100),
      },
    });
  };

  const openZoom = () => {
    set({ zoomOpen: true });
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  };

  return (
    <section
      onMouseMove={onMove}
      onMouseLeave={() => set({ tilt: { x: 0, y: 0, gx: 50, gy: 50 } })}
      style={{
        background: 'linear-gradient(135deg,#1c1917 0%,#141211 60%,#200a0f 100%)',
        borderRadius: L.radiusLg,
        padding: L.panelPad,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))',
        gap: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,.5)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'cdvRise .8s cubic-bezier(.2,.8,.2,1) both',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(194,43,69,.18), transparent 45%)`,
          transition: 'background .2s',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, position: 'relative' }}>
        <span style={{ fontSize: 12, color: '#c22b45' }}>
          {featured.category} · {featured.country}
        </span>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontWeight: 500,
            fontSize: 'clamp(34px,4vw,52px)',
            lineHeight: 1.02,
            margin: 0,
            letterSpacing: '-.01em',
            textWrap: 'pretty',
          }}
        >
          {featured.name}
        </h1>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, opacity: 0.75, maxWidth: '40ch', textWrap: 'pretty' }}>
          {featured.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, color: '#c22b45', lineHeight: 1 }}>
            {featured.priceLabel}
          </span>
          <span style={{ fontSize: 14, opacity: 0.8 }}>{featured.abv} alc./vol</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 11, letterSpacing: '.06em', opacity: 0.6 }}>Details</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                background: '#c22b45',
                color: '#fff4f5',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {featured.sizeLabel}
            </span>
            <span style={chipTag}>{featured.origin}</span>
            <span style={chipTag}>{featured.category}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          <span style={{ fontSize: 11, letterSpacing: '.06em', opacity: 0.6 }}>Ingredients</span>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, opacity: 0.7, textWrap: 'pretty' }}>
            {featured.ingredients}
          </p>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          minHeight: L.featuredH,
          borderRadius: 20,
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% 55%, #4a0d18 0%, #0d0b0a 70%)',
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform .25s ease-out',
          animation: 'cdvBreathe 5s ease-in-out infinite',
        }}
      >
        <img
          src={featuredImg}
          alt={featured.name}
          onClick={openZoom}
          title="View full screen"
          style={{
            cursor: 'zoom-in',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            position: 'absolute',
            inset: 0,
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 22%, #000 78%, transparent 100%)',
            maskImage: 'linear-gradient(90deg, transparent 0%, #000 22%, #000 78%, transparent 100%)',
          }}
        />

        {chips.map((ch) => (
          <div key={ch.key} style={{ position: 'absolute', left: ch.x, top: ch.y, width: 0, height: 0, perspective: '600px' }}>
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: `calc(${ch.size} / 2 + 8px)`,
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(20,8,10,.9)',
                border: '1px solid rgba(224,82,107,.45)',
                fontSize: 11,
                letterSpacing: '.03em',
                color: '#f3ece2',
                opacity: state.hoverChip === ch.key ? 1 : 0,
                transition: 'opacity .2s',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            >
              {ch.label}
            </span>
            <div
              onMouseEnter={() => set({ hoverChip: ch.key })}
              onMouseLeave={() => set({ hoverChip: null })}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: ch.size,
                height: ch.size,
                marginLeft: `calc(${ch.size} / -2)`,
                marginTop: `calc(${ch.size} / -2)`,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(224,82,107,.7)',
                boxShadow: '0 0 22px rgba(194,43,69,.55), inset 0 0 14px rgba(0,0,0,.6)',
                background: '#200a0f',
                transformStyle: 'preserve-3d',
                animation: `cdvTumble ${ch.dur} ease-in-out ${ch.delay} infinite`,
              }}
            >
              {ch.hasImg ? (
                <img
                  src={ch.img}
                  alt={ch.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#e0526b' }}>
                  <PathIcon d={ch.icon} width="55%" height="55%" strokeWidth={1.6} />
                </div>
              )}
            </div>
          </div>
        ))}

        {gallery.length > 1 && (
          <div style={{ position: 'absolute', left: 16, bottom: 16, display: 'flex', gap: 8, zIndex: 3 }}>
            {gallery.map((src, i) => (
              <Btn
                key={src + i}
                onClick={() => set({ galleryIdx: i })}
                style={{
                  width: 44,
                  height: 52,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `2px solid ${i === galleryIdx ? '#c22b45' : 'rgba(243,236,226,.3)'}`,
                  boxShadow: '0 6px 16px rgba(0,0,0,.5)',
                  transition: 'transform .2s',
                }}
                hoverStyle={{ transform: 'translateY(-2px)' }}
              >
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Btn>
            ))}
          </div>
        )}

        <Btn
          onClick={() => toggleWish(featured.id)}
          aria-label="Save"
          style={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: featured.saved ? '#c22b45' : '#262322',
            color: featured.saved ? '#fff4f5' : '#f3ece2',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,.5)',
          }}
        >
          <Icon size={18} fill={featured.saved ? '#c22b45' : 'none'}>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </Icon>
        </Btn>
      </div>
    </section>
  );
}
