import type { CSSProperties } from 'react';
import { useCart, useWishlist } from '../../store/selectors';
import { routes, useStore } from '../../store/store';
import { Btn } from '../ui/Hoverable';
import { Icon } from '../ui/Icon';
import type { Page } from '../../types';

const pill: CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: '50%',
  background: '#1a1817',
  display: 'grid',
  placeItems: 'center',
  border: '1px solid rgba(243,236,226,.08)',
};

/** Search, the page links, the account chip, wishlist and the bag. */
export function TopBar() {
  const { state, set, go, catSlug } = useStore();
  const { cartCount } = useCart();
  const { count: wishCount } = useWishlist();
  const { page, user, query, featuredId, cat } = state;

  const link = (target: Page, path: string, label: string) => (
    <Btn
      onClick={() => go(path)}
      style={{
        fontFamily: 'inherit',
        fontSize: 13,
        padding: '0 14px',
        color: page === target ? '#f3ece2' : 'rgba(243,236,226,.6)',
      }}
      hoverStyle={{ color: '#c22b45' }}
    >
      {label}
    </Btn>
  );

  // A search looks through the whole cellar, so it always lands on the full shop.
  const onSearch = (value: string) => {
    set({ query: value });
    if (value.trim()) {
      if (page !== 'shop' || featuredId || cat !== 'All') go(routes.shop());
    } else if (page !== 'shop' || featuredId) {
      go(routes.shop(catSlug));
    }
  };

  const clearSearch = () => {
    set({ query: '' });
    if (page === 'shop' && !featuredId) go(routes.shop());
  };

  const onAccount = () => {
    if (user) go(user.role === 'admin' ? routes.admin() : routes.account);
    else set({ authOpen: true, authMode: 'signin', authNext: null, authError: '', authNotice: '' });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <div
        style={{
          flex: '1 1 180px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#1a1817',
          borderRadius: 999,
          padding: '0 18px',
          height: 50,
          border: '1px solid rgba(243,236,226,.08)',
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') clearSearch();
          }}
          placeholder="Search for bottles…"
          aria-label="Search"
          autoComplete="off"
          style={{
            flex: 1,
            background: 'transparent',
            border: 0,
            outline: 0,
            color: '#f3ece2',
            font: 'inherit',
            fontSize: 14,
            minWidth: 0,
            WebkitAppearance: 'none',
          }}
        />
        {query ? (
          <Btn
            onClick={clearSearch}
            aria-label="Clear search"
            style={{ width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'rgba(243,236,226,.6)', transition: 'background .2s, color .2s' }}
            hoverStyle={{ background: 'rgba(243,236,226,.1)', color: '#f3ece2' }}
          >
            <Icon size={14} strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12" />
            </Icon>
          </Btn>
        ) : (
          <Icon>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </Icon>
        )}
      </div>

      {link('shop', routes.shop(), 'Shop')}
      {link('about', routes.about, 'About')}
      {link('contact', routes.contact, 'Contact')}

      <Btn
        onClick={onAccount}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 46,
          padding: '0 14px 0 6px',
          borderRadius: 999,
          background: '#1a1817',
          border: '1px solid rgba(243,236,226,.08)',
          fontFamily: 'inherit',
          fontSize: 13,
          transition: 'border-color .25s',
        }}
        hoverStyle={{ borderColor: '#c22b45' }}
      >
        {user ? (
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(180deg,#b8233d,#6e0f20)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff4f5',
            }}
          >
            {(user.name || user.email || 'G')[0].toUpperCase()}
          </span>
        ) : (
          <span
            style={{ width: 34, height: 34, borderRadius: '50%', background: '#262322', display: 'grid', placeItems: 'center' }}
          >
            <Icon>
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </Icon>
          </span>
        )}
        <span>{user ? (user.role === 'guest' ? 'Guest' : (user.name || user.email).split(' ')[0]) : 'Sign in'}</span>
      </Btn>

      <Btn
        onClick={() => go(routes.wishlist)}
        aria-label="Wishlist"
        style={{
          ...pill,
          transition: 'transform .25s',
          color: page === 'wishlist' || wishCount ? '#c22b45' : '#f3ece2',
        }}
      >
        <Icon size={18} fill={wishCount ? '#c22b45' : 'none'}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </Icon>
      </Btn>

      <Btn
        onClick={() => set({ cartOpen: true })}
        aria-label="Cart"
        style={{ ...pill, position: 'relative', transition: 'transform .25s' }}
        hoverStyle={{ color: '#c22b45', transform: 'scale(1.08)' }}
      >
        <Icon size={18}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </Icon>
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: 18,
            height: 18,
            borderRadius: 999,
            background: '#c22b45',
            color: '#fff4f5',
            fontSize: 10,
            fontWeight: 600,
            display: 'grid',
            placeItems: 'center',
            padding: '0 4px',
          }}
        >
          {cartCount}
        </span>
      </Btn>
    </div>
  );
}
