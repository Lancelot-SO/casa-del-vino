import { useShopView, useWishlist } from '../store/selectors';
import { cdn } from '../lib/cloudinary';
import { routes, useLayout, useStore } from '../store/store';
import { Btn } from '../components/ui/Hoverable';
import { Icon } from '../components/ui/Icon';

export function WishlistPage() {
  const { go, clearWishlist } = useStore();
  const L = useLayout();
  const { items, count } = useWishlist();
  const { openProduct, toggleWish, addToCart } = useShopView();

  return (
    <section
      style={{
        background: '#1a1817',
        borderRadius: L.radiusLg,
        padding: L.panelPad,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        animation: 'cdvRise .7s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#c22b45' }}>Saved bottles</span>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 34, margin: 0, lineHeight: 1.05 }}>
            Wishlist
          </h1>
        </div>
        {count > 0 && (
          <Btn
            onClick={clearWishlist}
            style={{
              fontSize: 11,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'rgba(243,236,226,.6)',
              padding: '8px 12px',
              borderRadius: 999,
              border: '1px solid rgba(243,236,226,.12)',
            }}
            hoverStyle={{ color: '#c22b45', borderColor: '#c22b45' }}
          >
            Clear all
          </Btn>
        )}
      </div>

      {count === 0 && (
        <>
          <p style={{ margin: 0, opacity: 0.7, fontSize: 14 }}>Nothing saved yet. Tap the heart on any bottle to keep it here.</p>
          <Btn
            onClick={() => go(routes.shop())}
            style={{
              alignSelf: 'flex-start',
              height: 50,
              padding: '0 24px',
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
              gap: 8,
            }}
            hoverStyle={{ filter: 'brightness(1.06)' }}
          >
            Browse the cellar
          </Btn>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,220px),1fr))', gap: 14 }}>
        {items.map((w) => (
          <div key={w.id} style={{ background: '#262322', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div onClick={() => openProduct(w.id)} style={{ aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
              <img src={cdn(w.img, 480)} alt={w.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {w.soldOut && (
                <span style={{ position: 'absolute', left: 10, top: 10, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 999, background: 'rgba(0,0,0,.7)' }}>
                  Sold out
                </span>
              )}
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, lineHeight: 1.1 }}>{w.name}</span>
                <span style={{ fontSize: 12, opacity: 0.6 }}>
                  {w.category} · {w.abv} · {w.sizeLabel}
                </span>
                <span style={{ fontSize: 13, color: '#c22b45' }}>{w.priceLabel}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn
                  onClick={() => addToCart(w.id)}
                  disabled={w.soldOut}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 12,
                    background: w.soldOut ? '#1a1817' : 'linear-gradient(180deg,#b8233d,#6e0f20)',
                    color: w.soldOut ? 'rgba(243,236,226,.5)' : '#fff4f5',
                    fontFamily: 'inherit',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  hoverStyle={w.soldOut ? undefined : { filter: 'brightness(1.06)' }}
                >
                  {w.soldOut ? 'Sold out' : 'Add to bag'}
                </Btn>
                <Btn
                  onClick={() => toggleWish(w.id)}
                  aria-label="Remove from wishlist"
                  style={{ width: 40, height: 40, borderRadius: 12, background: '#1a1817', display: 'grid', placeItems: 'center', color: '#c22b45' }}
                  hoverStyle={{ background: '#2a0a10' }}
                >
                  <Icon size={16} fill="#c22b45">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </Icon>
                </Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
