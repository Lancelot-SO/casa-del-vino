import { useMemo } from 'react';
import { CONFIG, ING_ICON } from '../data/catalog';
import { ghs } from '../lib/format';
import { routes, useStore } from './store';
import type { Product } from '../types';

export interface CartLine extends Product {
  qty: number;
  sizeLabel: string;
  unitPrice: string;
  lineTotal: string;
}

/** The bottles in the bag, resolved against the live catalog. */
export function useCart() {
  const { state, products, setCartQty, clearCart } = useStore();
  const { cart } = state;

  const cartLines = useMemo<CartLine[]>(
    () =>
      Object.entries(cart)
        .filter(([, n]) => n > 0)
        .map(([id, qty]) => {
          const p = products.find((x) => x.id === id);
          if (!p) return null;
          return {
            ...p,
            qty,
            sizeLabel: p.size || 'Standard',
            unitPrice: ghs(p.price),
            lineTotal: ghs(p.price * qty),
          };
        })
        .filter((l): l is CartLine => l !== null),
    [cart, products],
  );

  const cartCount = cartLines.reduce((a, l) => a + l.qty, 0);
  const subtotalN = cartLines.reduce((a, l) => a + l.price * l.qty, 0);
  /** Lines asking for more than the shelf holds. */
  const overStock = cartLines.filter((l) => l.qty > l.stock);

  const inc = (id: string) => {
    const p = products.find((x) => x.id === id);
    const cur = cart[id] || 0;
    if (p && cur >= p.stock) return;
    setCartQty(id, cur + 1);
  };
  const dec = (id: string) => setCartQty(id, (cart[id] || 0) - 1);
  const removeLine = (id: string) => setCartQty(id, 0);

  return { cartLines, cartCount, subtotalN, cartEmpty: cartCount === 0, overStock, inc, dec, removeLine, clearCart };
}

export interface Chip {
  key: string;
  label: string;
  x: string;
  y: string;
  size: string;
  img: string;
  hasImg: boolean;
  icon: string;
  dur: string;
  delay: string;
}

/**
 * The ingredient medallions arranged around the featured bottle: two columns
 * hugging the panel edges, tumbling in 3D on their own offset cycles.
 */
export function useChips(product: Product | undefined): Chip[] {
  const { state } = useStore();
  const imgs = state.ingImgs;
  return useMemo(() => {
    if (!product) return [];
    const entries = (product.list || []).slice(0, CONFIG.maxIngredients);
    const n = entries.length;
    const rows = Math.ceil(n / 2);
    return entries.map((ing, i) => {
      const left = i % 2 === 0;
      const row = Math.floor(i / 2);
      const y = rows === 1 ? 50 : 18 + row * (64 / (rows - 1));
      const x = left ? 17 : 83;
      const img = ing.imageUrl || imgs[ing.article] || '';
      return {
        key: product.id + '-' + i,
        label: ing.label,
        x: x + '%',
        y: y + '%',
        size: 52 + (i % 3) * 6 + 'px',
        img,
        hasImg: !!img,
        icon: ING_ICON[ing.icon] || ING_ICON.leaf,
        dur: 9 + (i % 3) * 2 + 's',
        delay: -i * 2.3 + 's',
      };
    });
  }, [product, imgs]);
}

export interface ProductView extends Product {
  priceLabel: string;
  sizeLabel: string;
  saved: boolean;
  soldOut: boolean;
}

const view = (p: Product, wish: Record<string, boolean>): ProductView => ({
  ...p,
  priceLabel: ghs(p.price),
  sizeLabel: p.size || 'Standard',
  saved: !!wish[p.id],
  soldOut: p.stock <= 0,
});

/** Accents dropped and lower-cased, so "rioja" finds "Rioja" and "cava" finds "Cavà". */
const fold = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Everything a bottle can be found by, as one folded string. */
const haystack = (p: Product): string =>
  fold(
    [p.name, p.category, p.country, p.origin, p.size, p.abv, p.description, p.ingredients, ...(p.list || []).map((i) => i.label)].join(' '),
  );

/** True when every word typed appears somewhere in the bottle's text. */
export const matchesQuery = (p: Product, query: string): boolean => {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = haystack(p);
  return words.every((w) => text.includes(w));
};

/** Filtering, the search results, the featured bottle and the "You may also like" rail. */
export function useShopView() {
  const { state, products, set, go, toggleWish, setCartQty } = useStore();
  const { cat, query, featuredId, wish } = state;
  const q = query.trim();
  /** Search results replace the shelf, unless a bottle was opened directly. */
  const searching = !!q && !featuredId;

  const visible = useMemo(() => products.filter((p) => p.active), [products]);

  // A search looks through the whole cellar; a shelf shows only its own bottles.
  const list = useMemo(
    () => (q ? visible.filter((p) => matchesQuery(p, q)) : visible.filter((p) => cat === 'All' || p.category === cat)),
    [visible, cat, q],
  );

  const results = useMemo(() => list.map((p) => view(p, wish)), [list, wish]);

  // A direct /product/:id link wins even when it falls outside the current filter.
  const direct = featuredId ? visible.find((p) => p.id === featuredId) : undefined;
  const featuredRaw = direct || list[0];
  const featured = featuredRaw ? view(featuredRaw, wish) : undefined;
  const rail = useMemo(
    () => list.filter((p) => !featuredRaw || p.id !== featuredRaw.id).map((p) => view(p, wish)),
    [list, featuredRaw, wish],
  );

  const images = featuredRaw?.images ?? [];
  const galleryIdx = Math.min(state.galleryIdx, Math.max(0, (images.length || 1) - 1));
  const featuredImg = (images[galleryIdx] || featuredRaw?.img) ?? '/assets/syrah.jpg';

  const openProduct = (id: string) => {
    set({ galleryIdx: 0 });
    go(routes.product(id));
  };
  const clearSearch = () => {
    set({ query: '' });
    go(routes.shop());
  };
  const addToCart = (id: string) => {
    const p = products.find((x) => x.id === id);
    const cur = state.cart[id] || 0;
    if (p && cur >= p.stock) {
      set({ cartOpen: true });
      return;
    }
    setCartQty(id, cur + 1);
    set({ cartOpen: true });
  };
  const buyNow = (id: string) => {
    const p = products.find((x) => x.id === id);
    const cur = state.cart[id] || 0;
    if (!p || p.stock <= 0) return;
    if (cur < p.stock) setCartQty(id, cur + 1);
    set({ cartOpen: false, step: 1, order: null, checkoutError: '' });
    go(routes.checkout);
  };

  return {
    list,
    featuredRaw,
    featured,
    featuredImg,
    gallery: images,
    galleryIdx,
    rail,
    searching,
    query: q,
    results,
    hasProducts: list.length > 0 || !!direct,
    emptyTitle: q ? `No match for "${q}"` : cat,
    openProduct,
    clearSearch,
    toggleWish,
    addToCart,
    buyNow,
  };
}

/** Bottles kept on the wishlist. */
export function useWishlist() {
  const { state, products } = useStore();
  const items = products.filter((p) => p.active && state.wish[p.id]).map((p) => view(p, state.wish));
  return { items, count: items.length };
}
