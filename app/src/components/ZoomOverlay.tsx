import { useEffect } from 'react';
import { cdn } from '../lib/cloudinary';
import { useShopView } from '../store/selectors';
import { useStore } from '../store/store';
import { Btn } from './ui/Hoverable';
import { Icon } from './ui/Icon';

/**
 * The featured photo enlarged to about 70% of the screen, floating over the
 * page, which stays visible but blurred and dimmed behind it.
 */
export function ZoomOverlay() {
  const { state, set } = useStore();
  const { featured, featuredImg } = useShopView();
  const open = state.zoomOpen && !!featured;

  // Escape closes it, like any lightbox.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') set({ zoomOpen: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, set]);

  if (!open || !featured) return null;

  const close = () => set({ zoomOpen: false });

  return (
    <div
      onClick={close}
      role="dialog"
      aria-modal
      aria-label={featured.name}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'grid',
        placeItems: 'center',
        cursor: 'zoom-out',
        background: 'rgba(8,3,4,.55)',
        backdropFilter: 'blur(18px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.1)',
        animation: 'cdvFadeIn .25s ease both',
      }}
    >
      {/* A soft, blurred copy of the same photo glows behind the sharp one. */}
      <img
        src={cdn(featuredImg, 600)}
        alt=""
        aria-hidden
        style={{
          position: 'absolute',
          width: '78vmin',
          height: '78vmin',
          objectFit: 'cover',
          borderRadius: '50%',
          filter: 'blur(70px) saturate(1.3)',
          opacity: 0.55,
          pointerEvents: 'none',
        }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '70vw',
          maxHeight: '70vh',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,.75), 0 0 60px rgba(194,43,69,.25)',
          border: '1px solid rgba(243,236,226,.12)',
          background: '#0d0b0a',
          cursor: 'default',
          animation: 'cdvRise .35s cubic-bezier(.2,.8,.2,1) both',
        }}
      >
        <img
          src={cdn(featuredImg, 1600)}
          alt={featured.name}
          style={{ display: 'block', maxWidth: '70vw', maxHeight: '70vh', width: 'auto', height: 'auto', objectFit: 'contain' }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '28px 22px 18px',
            background: 'linear-gradient(0deg, rgba(5,2,2,.85), transparent)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, lineHeight: 1.1 }}>{featured.name}</span>
          <span style={{ fontSize: 12, color: '#e0526b' }}>
            {featured.category} · {featured.country} · {featured.abv} vol
          </span>
        </div>
        <Btn
          onClick={close}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(5,2,2,.6)',
            border: '1px solid rgba(243,236,226,.15)',
            display: 'grid',
            placeItems: 'center',
            color: '#f3ece2',
            boxSizing: 'border-box',
          }}
          hoverStyle={{ background: '#c22b45', borderColor: '#c22b45' }}
        >
          <Icon size={18} strokeWidth={2}>
            <path d="M18 6 6 18M6 6l12 12" />
          </Icon>
        </Btn>
      </div>
    </div>
  );
}
