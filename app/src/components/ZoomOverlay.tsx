import { useShopView } from '../store/selectors';
import { useStore } from '../store/store';
import { Btn } from './ui/Hoverable';
import { Icon } from './ui/Icon';

/** The featured photo opened full screen, with the bottle's details in the corner. */
export function ZoomOverlay() {
  const { state, set } = useStore();
  const { featured, featuredImg } = useShopView();

  if (!state.zoomOpen || !featured) return null;

  const close = () => {
    set({ zoomOpen: false });
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  };

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(5,2,2,.96)',
        display: 'grid',
        placeItems: 'center',
        cursor: 'zoom-out',
      }}
    >
      <img
        src={featuredImg}
        alt={featured.name}
        style={{
          maxWidth: '100vw',
          maxHeight: '100vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          boxShadow: '0 30px 80px rgba(0,0,0,.8)',
        }}
      />
      <div
        style={{ position: 'absolute', left: 24, bottom: 24, display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: 'none' }}
      >
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26 }}>{featured.name}</span>
        <span style={{ fontSize: 12, color: '#e0526b' }}>
          {featured.category} · {featured.country} · {featured.abv} vol
        </span>
      </div>
      <Btn
        onClick={close}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(243,236,226,.1)',
          display: 'grid',
          placeItems: 'center',
          color: '#f3ece2',
        }}
        hoverStyle={{ background: '#c22b45' }}
      >
        <Icon size={18} strokeWidth={2}>
          <path d="M18 6 6 18M6 6l12 12" />
        </Icon>
      </Btn>
    </div>
  );
}
