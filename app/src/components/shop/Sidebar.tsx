import type { CSSProperties } from 'react';
import { CATEGORIES, ICON } from '../../data/catalog';
import { useLayout, useStore } from '../../store/store';
import { Box, Btn } from '../ui/Hoverable';
import { Icon, PathIcon } from '../ui/Icon';

const navBtn: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 10px',
  borderRadius: 999,
  fontFamily: 'inherit',
  fontSize: 13,
  color: '#f3ece2',
};

const bullet: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: '#262322',
  display: 'grid',
  placeItems: 'center',
  flex: 'none',
  color: '#c22b45',
};

/** The cellar rail: brand, category shelves, the secondary pages and the promo card. */
export function Sidebar() {
  const { state, products, set } = useStore();
  const L = useLayout();
  const { page, cat, user } = state;
  const isAdmin = !!user && user.role === 'admin';

  return (
    <aside
      style={{
        flex: L.asideFlex,
        maxWidth: '100%',
        minWidth: 0,
        background: '#1a1817',
        borderRadius: L.radiusLg,
        animation: 'cdvRise .8s cubic-bezier(.2,.8,.2,1) both',
        padding: L.asidePad,
        display: 'flex',
        flexDirection: 'column',
        gap: L.asideGap,
        boxShadow: '0 20px 60px rgba(0,0,0,.6)',
        alignSelf: 'flex-start',
        position: L.asidePos,
        top: L.asideTop,
        zIndex: 5,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 6px' }}>
        <img
          src="assets/logo.jpg"
          alt=""
          style={{ width: 40, height: 40, objectFit: 'cover', objectPosition: 'center 58%', borderRadius: '50%' }}
        />
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
          Casa del Vino
        </span>
      </div>

      {L.isDesktop && (
        <div style={{ padding: '0 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 500, lineHeight: 1 }}>
            Cellar
          </span>
          <span style={{ width: 36, height: 2, background: '#c22b45' }} />
        </div>
      )}

      <nav
        className="cdv-noscrollbar"
        style={{
          display: 'flex',
          flexDirection: L.navDir,
          gap: 4,
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          margin: '0 -4px',
          padding: '0 4px',
        }}
      >
        {CATEGORIES.map(([label, ic]) => {
          const on = cat === label && page === 'shop';
          const count = label === 'All' ? products.length : products.filter((p) => p.category === label).length;
          return (
            <Btn
              key={label}
              onClick={() => set({ cat: label, page: 'shop', featuredId: null })}
              style={{
                ...navBtn,
                border: `1px solid ${on ? '#c22b45' : 'transparent'}`,
                background: on ? 'rgba(194,43,69,.12)' : 'transparent',
                transition: 'transform .25s, background .25s',
                whiteSpace: 'nowrap',
                flex: 'none',
              }}
              hoverStyle={{ background: 'rgba(243,236,226,.06)', transform: 'translateX(6px)' }}
            >
              <span style={{ ...bullet, color: on ? '#c22b45' : 'rgba(243,236,226,.7)' }}>
                <PathIcon d={ICON[ic]} />
              </span>
              <span style={{ flex: 1 }}>{label}</span>
              <span style={{ fontSize: 11, opacity: 0.5 }}>{count}</span>
            </Btn>
          );
        })}
      </nav>

      {L.isDesktop && (
        <>
          {isAdmin && (
            <Btn
              onClick={() => set({ page: 'admin', adminEdit: null, adminTab: 'dashboard' })}
              style={{ ...navBtn, border: `1px solid ${page === 'admin' ? '#c22b45' : 'transparent'}` }}
              hoverStyle={{ background: 'rgba(243,236,226,.06)' }}
            >
              <span style={bullet}>
                <Icon>
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </Icon>
              </span>
              <span>Admin</span>
            </Btn>
          )}

          <Btn
            onClick={() => set({ page: 'about' })}
            style={{ ...navBtn, border: `1px solid ${page === 'about' ? '#c22b45' : 'transparent'}` }}
            hoverStyle={{ background: 'rgba(243,236,226,.06)' }}
          >
            <span style={bullet}>
              <Icon>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </Icon>
            </span>
            <span>About us</span>
          </Btn>

          <Btn
            onClick={() => set({ page: 'contact' })}
            style={{ ...navBtn, border: `1px solid ${page === 'contact' ? '#c22b45' : 'transparent'}` }}
            hoverStyle={{ background: 'rgba(243,236,226,.06)' }}
          >
            <span style={bullet}>
              <Icon>
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </Icon>
            </span>
            <span>Contact us</span>
          </Btn>

          <Box
            onClick={() => set({ page: 'shop' })}
            style={{
              marginTop: 'auto',
              position: 'relative',
              borderRadius: 20,
              overflow: 'hidden',
              aspectRatio: '1/1.15',
              cursor: 'pointer',
              transition: 'transform .4s cubic-bezier(.2,.8,.2,1), box-shadow .4s',
            }}
            hoverStyle={{
              transform: 'perspective(600px) rotateX(4deg) rotateY(-6deg) translateY(-4px)',
              boxShadow: '0 20px 40px rgba(0,0,0,.6)',
            }}
          >
            <img
              src="assets/logo.jpg"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,.2), rgba(0,0,0,.85))',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                gap: 10,
                padding: 18,
              }}
            >
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, lineHeight: 1.1 }}>
                Autumn
                <br />
                Collection
                <br />
                <span style={{ color: '#c22b45' }}>2026</span>
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  alignSelf: 'flex-start',
                  border: '1px solid rgba(243,236,226,.5)',
                  borderRadius: 999,
                  padding: '6px 12px',
                  fontSize: 10,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                }}
              >
                Explore now <span>›</span>
              </span>
            </div>
          </Box>
        </>
      )}
    </aside>
  );
}
