import { useMemo } from 'react';
import { CONFIG, ING_ICON } from '../data/catalog';
import { eur } from '../lib/format';
import { useStore } from './store';
import type { Product } from '../types';

export interface CartLine extends Product {
  qty: number;
  sizeLabel: string;
  unitPrice: string;
  lineTotal: string;
}

/** The bottles left in the bag, resolved against the live catalog. */
export function useCart() {
  const { state, products, set } = useStore();
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
            unitPrice: eur(p.price),
            lineTotal: eur(p.price * qty),
          };
        })
        .filter((l): l is CartLine => l !== null),
    [cart, products],
  );

  const cartCount = cartLines.reduce((a, l) => a + l.qty, 0);
  const subtotalN = cartLines.reduce((a, l) => a + l.price * l.qty, 0);

  const inc = (id: string) => set((s) => ({ cart: { ...s.cart, [id]: (s.cart[id] || 0) + 1 } }));
  const dec = (id: string) => set((s) => ({ cart: { ...s.cart, [id]: (s.cart[id] || 0) - 1 } }));
  const removeLine = (id: string) =>
    set((s) => {
      const c = { ...s.cart };
      delete c[id];
      return { cart: c };
    });
  const clearCart = () => set({ cart: {} });

  return { cartLines, cartCount, subtotalN, cartEmpty: cartCount === 0, inc, dec, removeLine, clearCart };
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
    return entries.map(([label, article, icon], i) => {
      const left = i % 2 === 0;
      const row = Math.floor(i / 2);
      const y = rows === 1 ? 50 : 18 + row * (64 / (rows - 1));
      const x = left ? 17 : 83;
      const img = imgs[article] || '';
      return {
        key: product.id + '-' + i,
        label,
        x: x + '%',
        y: y + '%',
        size: 52 + (i % 3) * 6 + 'px',
        img,
        hasImg: !!img,
        icon: ING_ICON[icon] || ING_ICON.leaf,
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
}

const view = (p: Product, wish: Record<string, boolean>): ProductView => ({
  ...p,
  priceLabel: eur(p.price),
  sizeLabel: p.size || 'Standard',
  saved: !!wish[p.id],
});

/** Filtering, the featured bottle and the "You may also like" rail. */
export function useShopView() {
  const { state, products, set } = useStore();
  const { cat, query, featuredId, wish, wishOnly } = state;
  const q = query.trim().toLowerCase();

  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          (cat === 'All' || p.category === cat) &&
          (!wishOnly || wish[p.id]) &&
          (!q || (p.name + ' ' + p.category + ' ' + p.country).toLowerCase().includes(q)),
      ),
    [products, cat, wishOnly, wish, q],
  );

  const featuredRaw = list.find((p) => p.id === featuredId) || list[0];
  const featured = featuredRaw ? view(featuredRaw, wish) : undefined;
  const rail = useMemo(
    () => list.filter((p) => !featuredRaw || p.id !== featuredRaw.id).map((p) => view(p, wish)),
    [list, featuredRaw, wish],
  );

  const images = featuredRaw?.images ?? [];
  const galleryIdx = Math.min(state.galleryIdx, Math.max(0, (images.length || 1) - 1));
  const featuredImg = (images[galleryIdx] || featuredRaw?.img) ?? 'assets/syrah.jpg';

  const openProduct = (id: string) => {
    set({ featuredId: id, galleryIdx: 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const toggleWish = (id: string) => set((s) => ({ wish: { ...s.wish, [id]: !s.wish[id] } }));
  const addToCart = (id: string) => set((s) => ({ cart: { ...s.cart, [id]: (s.cart[id] || 0) + 1 }, cartOpen: true }));
  const buyNow = (id: string) =>
    set((s) => ({
      cart: { ...s.cart, [id]: (s.cart[id] || 0) + 1 },
      cartOpen: false,
      page: 'checkout',
      step: 1,
      order: null,
    }));

  return {
    list,
    featuredRaw,
    featured,
    featuredImg,
    gallery: images,
    galleryIdx,
    rail,
    hasProducts: list.length > 0,
    emptyTitle: wishOnly ? 'Nothing saved yet' : q ? `No match for "${query}"` : cat,
    openProduct,
    toggleWish,
    addToCart,
    buyNow,
  };
}

/** Bottles kept on the wishlist. */
export function useWishlist() {
  const { state, products } = useStore();
  const items = products.filter((p) => state.wish[p.id]).map((p) => view(p, state.wish));
  return { items, count: items.length };
}
