import { useShopView } from '../store/selectors';
import { routes, useStore } from '../store/store';
import { ghs } from '../lib/format';
import { FeaturedPanel } from '../components/shop/FeaturedPanel';
import { ProductCard, ProductRail } from '../components/shop/ProductRail';
import { Box, Btn } from '../components/ui/Hoverable';
import { Icon } from '../components/ui/Icon';

const badge = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  background: '#1a1817',
  borderRadius: 16,
  padding: '14px 16px',
} as const;

/** Free shipping / returns / secure payment, under the shelf. */
function TrustBadges() {
  const { settings } = useStore();
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
        gap: 12,
        animation: 'cdvRise .8s cubic-bezier(.2,.8,.2,1) .3s both',
      }}
    >
      <Box style={{ ...badge, transition: 'transform .3s, background .3s' }} hoverStyle={{ transform: 'translateY(-3px)', background: '#221d1c' }}>
        <Icon size={22} stroke="#c22b45" strokeWidth={1.6}>
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
          <circle cx="17" cy="18" r="2" />
          <circle cx="7" cy="18" r="2" />
        </Icon>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13 }}>Free shipping</span>
          <span style={{ fontSize: 11, opacity: 0.55 }}>On standard orders over {ghs(settings.freeShip)}</span>
        </div>
      </Box>
      <div style={badge}>
        <Icon size={22} stroke="#c22b45" strokeWidth={1.6}>
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </Icon>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13 }}>Easy returns</span>
          <span style={{ fontSize: 11, opacity: 0.55 }}>Unopened, within 14 days</span>
        </div>
      </div>
      <div style={badge}>
        <Icon size={22} stroke="#c22b45" strokeWidth={1.6}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        </Icon>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13 }}>Secure payment</span>
          <span style={{ fontSize: 11, opacity: 0.55 }}>Age verified at checkout</span>
        </div>
      </div>
    </section>
  );
}

function Notice({ kicker, title, body, action }: { kicker: string; title: string; body: string; action?: { label: string; onClick: () => void } }) {
  return (
    <section
      style={{
        background: '#1a1817',
        borderRadius: 28,
        padding: '56px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'flex-start',
        animation: 'cdvRise .7s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <span style={{ fontSize: 12, color: '#c22b45', letterSpacing: '.12em', textTransform: 'uppercase' }}>{kicker}</span>
      <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 40, margin: 0, lineHeight: 1.05 }}>{title}</h1>
      <p style={{ margin: 0, opacity: 0.7, maxWidth: '48ch', textWrap: 'pretty' }}>{body}</p>
      {action && (
        <Btn
          onClick={action.onClick}
          style={{
            marginTop: 8,
            padding: '12px 22px',
            borderRadius: 12,
            background: '#c22b45',
            color: '#fff4f5',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
          }}
        >
          {action.label}
        </Btn>
      )}
    </section>
  );
}

/** What the search found, across every shelf, in place of the featured bottle. */
function SearchResults() {
  const { query, results, openProduct, clearSearch } = useShopView();
  const n = results.length;

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        animation: 'cdvRise .6s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '0 4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#c22b45', letterSpacing: '.12em', textTransform: 'uppercase' }}>Search</span>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 'clamp(28px,3.5vw,40px)', margin: 0, lineHeight: 1.05 }}>
            {n} {n === 1 ? 'bottle' : 'bottles'} for “{query}”
          </h1>
        </div>
        <Btn onClick={clearSearch} style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(243,236,226,.7)', padding: '8px 0' }} hoverStyle={{ color: '#c22b45' }}>
          Clear search
        </Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,160px),1fr))', gap: 14 }}>
        {results.map((p, i) => (
          <ProductCard key={p.id} p={p} index={i} onOpen={openProduct} />
        ))}
      </div>
    </section>
  );
}

export function ShopPage() {
  const { state, set, go } = useStore();
  const { featured, hasProducts, emptyTitle, searching, addToCart, buyNow, clearSearch } = useShopView();

  if (!state.catalogLoaded) {
    return <Notice kicker="One moment" title="Opening the cellar…" body="Fetching the bottles on the shelf." />;
  }
  if (state.catalogError) {
    return (
      <Notice
        kicker="Cellar unavailable"
        title="We could not reach the cellar"
        body={state.catalogError}
        action={{ label: 'Try again', onClick: () => window.location.reload() }}
      />
    );
  }
  if (searching && !hasProducts) {
    return (
      <Notice
        kicker="Search"
        title={emptyTitle}
        body="Nothing on our shelves matches that. Try a grape, a country, a shelf or part of the name."
        action={{ label: 'Clear search', onClick: clearSearch }}
      />
    );
  }
  if (searching) {
    return (
      <>
        <SearchResults />
        <TrustBadges />
      </>
    );
  }
  if (!hasProducts || !featured) {
    return (
      <Notice
        kicker="Coming soon"
        title={emptyTitle}
        body="We are still sourcing bottles for this shelf. Check back shortly, or browse the rest of the cellar."
        action={{
          label: 'Show everything',
          onClick: () => {
            set({ query: '' });
            go(routes.shop());
          },
        }}
      />
    );
  }

  return (
    <>
      <FeaturedPanel />
      <ProductRail />
      <TrustBadges />
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <Btn
          onClick={() => addToCart(featured.id)}
          disabled={featured.soldOut}
          style={{
            flex: '1 1 260px',
            height: 56,
            borderRadius: 14,
            background: featured.soldOut ? '#262322' : 'linear-gradient(180deg,#b8233d,#6e0f20)',
            color: featured.soldOut ? 'rgba(243,236,226,.5)' : '#fff4f5',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: featured.soldOut ? 'none' : '0 10px 30px rgba(194,43,69,.3)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform .25s, box-shadow .25s',
            cursor: featured.soldOut ? 'default' : 'pointer',
          }}
          hoverStyle={featured.soldOut ? undefined : { transform: 'translateY(-2px) scale(1.01)', boxShadow: '0 16px 40px rgba(194,43,69,.45)' }}
        >
          {!featured.soldOut && (
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
          )}
          <Icon strokeWidth={2}>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </Icon>
          {featured.soldOut ? 'Sold out' : 'Add to bag'}
        </Btn>
        <Btn
          onClick={() => buyNow(featured.id)}
          disabled={featured.soldOut}
          style={{
            flex: '1 1 200px',
            height: 56,
            borderRadius: 14,
            background: '#1a1817',
            border: '1px solid rgba(243,236,226,.15)',
            color: featured.soldOut ? 'rgba(243,236,226,.4)' : '#f3ece2',
            fontFamily: 'inherit',
            fontSize: 13,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
          hoverStyle={featured.soldOut ? undefined : { borderColor: '#c22b45' }}
        >
          Buy now
        </Btn>
      </section>
    </>
  );
}
