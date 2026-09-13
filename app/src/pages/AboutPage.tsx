import type { ReactNode } from 'react';
import { routes, useStore } from '../store/store';
import { Box, Btn } from '../components/ui/Hoverable';
import { Icon } from '../components/ui/Icon';

const figure = {
  background: '#1a1817',
  borderRadius: 20,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  transition: 'transform .35s, box-shadow .35s',
} as const;

const liftShadow = {
  transform: 'translateY(-6px)',
  boxShadow: '0 18px 40px rgba(0,0,0,.5), 0 0 24px rgba(194,43,69,.25)',
} as const;

function Figure({ value, label, note }: { value: ReactNode; label: string; note: string }) {
  return (
    <Box style={figure} hoverStyle={liftShadow}>
      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 44, lineHeight: 1, color: '#c22b45' }}>{value}</span>
      <span style={{ fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: 12, opacity: 0.55 }}>{note}</span>
    </Box>
  );
}

function ValueCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <Box
      style={{ ...figure, gap: 10 }}
      hoverStyle={{
        transform: 'perspective(700px) rotateX(3deg) translateY(-6px)',
        boxShadow: '0 18px 40px rgba(0,0,0,.5), 0 0 24px rgba(194,43,69,.25)',
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#262322',
          display: 'grid',
          placeItems: 'center',
          color: '#c22b45',
        }}
      >
        {icon}
      </span>
      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22 }}>{title}</span>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, opacity: 0.7, textWrap: 'pretty' }}>{body}</p>
    </Box>
  );
}

export function AboutPage() {
  const { state, products, go } = useStore();
  const countries = [...new Set(products.filter((p) => p.active).map((p) => p.country).filter(Boolean))];
  const liveCount = products.filter((p) => p.active).length;

  return (
    <>
      <section
        style={{
          animation: 'cdvRise .8s cubic-bezier(.2,.8,.2,1) both',
          background: 'linear-gradient(135deg,#1c1917 0%,#141211 60%,#200a0f 100%)',
          borderRadius: 28,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          boxShadow: '0 20px 60px rgba(0,0,0,.5)',
        }}
      >
        <div style={{ position: 'relative', minHeight: 360 }}>
          <img
            src="/assets/logo.jpg"
            alt="Casa del Vino"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, transparent 55%, #141211 100%), linear-gradient(0deg, #141211 0%, transparent 30%)',
            }}
          />
        </div>
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: '#c22b45' }}>About us</span>
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
            Good wine.
            <br />
            Better company.
          </h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, opacity: 0.8, maxWidth: '46ch', textWrap: 'pretty' }}>
            Casa del Vino, the house of wine, is a cellar built on one idea: a bottle should be honest about what it is. We
            source wines and spirits from Spain, Italy, Sweden and France, and list every one with its origin, its strength
            and what went into it.
          </p>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, opacity: 0.8, maxWidth: '46ch', textWrap: 'pretty' }}>
            From a full-bodied Spanish Syrah to a Galician cream liqueur and a Swedish vodka, the shelf is chosen bottle by
            bottle. Non-alcoholic reds and whites are on their way.
          </p>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
          gap: 14,
          animation: 'cdvRise .8s cubic-bezier(.2,.8,.2,1) .15s both',
        }}
      >
        <Figure value={countries.length || 4} label="Countries of origin" note={countries.length ? countries.join(' · ') : 'Spain · Italy · Sweden · France'} />
        <Figure value={liveCount} label="Bottles in the cellar" note="Each with origin, strength and ingredients" />
        <Figure value={state.categories.length || 8} label="Shelves" note="From red wine to non-alcoholic white" />
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
          gap: 14,
          animation: 'cdvRise .8s cubic-bezier(.2,.8,.2,1) .3s both',
        }}
      >
        <ValueCard
          icon={
            <Icon size={18}>
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </Icon>
          }
          title="Sourced at origin"
          body="We buy from the regions the bottles come from and say exactly where: Åhus, Galicia, the Highlands."
        />
        <ValueCard
          icon={
            <Icon size={18}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </Icon>
          }
          title="Nothing hidden"
          body="Alcohol strength, bottle size and the full ingredient list sit next to every product, not in the small print."
        />
        <ValueCard
          icon={
            <Icon size={18}>
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </Icon>
          }
          title="Better company"
          body="Wine is for sharing. Tell us the occasion and we'll help you pick the bottle."
        />
      </section>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <Btn
          onClick={() => go(routes.shop())}
          style={{
            flex: '1 1 240px',
            height: 56,
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
          hoverStyle={{ filter: 'brightness(1.06)' }}
        >
          Explore the cellar
        </Btn>
        <Btn
          onClick={() => go(routes.contact)}
          style={{
            flex: '1 1 200px',
            height: 56,
            borderRadius: 14,
            background: '#1a1817',
            border: '1px solid rgba(243,236,226,.15)',
            color: '#f3ece2',
            fontFamily: 'inherit',
            fontSize: 13,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
          hoverStyle={{ borderColor: '#c22b45' }}
        >
          Get in touch
        </Btn>
      </section>
    </>
  );
}
