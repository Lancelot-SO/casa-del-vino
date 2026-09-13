import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CONFIG, DEFAULT_ACCOUNTS, DEFAULT_SETTINGS, PRODUCTS } from '../data/catalog';
import { KEYS, persist, persistRaw, read, readRaw, remove } from '../lib/storage';
import type {
  Account,
  Activity,
  ActivityType,
  AdminTab,
  AuthMode,
  CheckoutForm,
  Order,
  Page,
  PayId,
  Product,
  ProductDraft,
  Settings,
  ShipId,
  User,
} from '../types';

export interface AppState {
  /** null until the admin edits the catalog; then the saved list wins. */
  products: Product[] | null;
  splash: boolean;
  page: Page;
  cat: string;
  query: string;
  featuredId: string | null;
  galleryIdx: number;
  wish: Record<string, boolean>;
  wishOnly: boolean;
  cart: Record<string, number>;
  cartOpen: boolean;
  zoomOpen: boolean;
  sent: boolean;

  step: 1 | 2 | 3 | 4;
  ship: ShipId;
  pay: PayId;
  form: CheckoutForm;
  order: Order | null;
  orders: Order[];

  user: User | null;
  users: Account[];
  authOpen: boolean;
  authMode: AuthMode;
  authForm: { name?: string; email?: string; password?: string };
  authError: string;
  authNext: 'checkout' | null;
  showPw: boolean;

  adminTab: AdminTab;
  adminEdit: ProductDraft | null;
  adminQuery: string;
  adminToast: string;
  notifOpen: boolean;
  notifReadAt: string;
  activity: Activity[];
  settings: Partial<Settings>;

  /** Fetched ingredient photos, keyed by wikipedia article name. */
  ingImgs: Record<string, string>;
  hoverChip: string | null;
  hoverCard: string | null;
  tilt: { x: number; y: number; gx: number; gy: number };
  vw: number;
}

const EMPTY_FORM: CheckoutForm = {
  name: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  adult: false,
  card: '',
  cardName: '',
  exp: '',
  cvc: '',
};

const initialState: AppState = {
  products: null,
  splash: CONFIG.showSplash,
  page: 'shop',
  cat: 'All',
  query: '',
  featuredId: null,
  galleryIdx: 0,
  wish: {},
  wishOnly: false,
  cart: {},
  cartOpen: false,
  zoomOpen: false,
  sent: false,
  step: 1,
  ship: 'standard',
  pay: 'card',
  form: EMPTY_FORM,
  order: null,
  orders: [],
  user: null,
  users: DEFAULT_ACCOUNTS,
  authOpen: false,
  authMode: 'signin',
  authForm: {},
  authError: '',
  authNext: null,
  showPw: false,
  adminTab: 'dashboard',
  adminEdit: null,
  adminQuery: '',
  adminToast: '',
  notifOpen: false,
  notifReadAt: '1970-01-01',
  activity: [],
  settings: {},
  ingImgs: {},
  hoverChip: null,
  hoverCard: null,
  tilt: { x: 0, y: 0, gx: 50, gy: 50 },
  vw: typeof window === 'undefined' ? 1200 : window.innerWidth,
};

type Patch = Partial<AppState> | ((s: AppState) => Partial<AppState> | null);

export interface Store {
  state: AppState;
  set: (patch: Patch) => void;
  /** The live catalog: admin edits if there are any, otherwise the defaults. */
  products: Product[];
  settings: Settings;
  saveProducts: (list: Product[]) => void;
  resetCatalog: () => void;
  logActivity: (type: ActivityType, title: string, ref: string) => void;
  toast: (message: string) => void;
  signIn: (user: User) => void;
  signOut: () => void;
  saveAccounts: (list: Account[]) => void;
  saveOrder: (order: Order) => void;
  saveSettings: () => void;
  markNotificationsRead: () => void;
  /** Re-fetch the floating ingredient photos (after a catalog change). */
  reloadIngredientImages: () => void;
}

const StoreContext = createContext<Store | null>(null);

const FALLBACK_ARTICLE: Record<string, string> = {
  Ristafallet: 'Waterfall',
  Steall_Waterfall: 'Waterfall',
  Orujo: 'Brandy',
  'Åhus': 'Sweden',
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const toastTimer = useRef<number | undefined>(undefined);
  const objectUrls = useRef<string[]>([]);

  const set = useCallback((patch: Patch) => {
    setState((s) => {
      const next = typeof patch === 'function' ? patch(s) : patch;
      return next ? { ...s, ...next } : s;
    });
  }, []);

  const products = state.products ?? PRODUCTS;
  const settings = useMemo<Settings>(() => ({ ...DEFAULT_SETTINGS, ...state.settings }), [state.settings]);

  /**
   * Every floating ingredient medallion shows the lead photo of that
   * ingredient's encyclopedia article. Wikimedia rejects a resized thumbnail
   * URL (HTTP 400), so the thumbnail is fetched exactly as served and verified
   * as a real image before it reaches a medallion; anything that fails falls
   * back to the wine-red line icon.
   */
  const loadIngredientImages = useCallback(async (list: Product[]) => {
    const articles = [...new Set(list.flatMap((p) => (p.list || []).map((x) => x[1])))];
    const out: Record<string, string> = {};
    const summary = async (name: string): Promise<string | undefined> => {
      const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(name));
      const j = (await r.json()) as { thumbnail?: { source?: string } };
      return j.thumbnail?.source;
    };
    await Promise.all(
      articles.map(async (a) => {
        try {
          let src: string | undefined;
          try {
            src = await summary(a);
          } catch {
            /* fall through to the backup article */
          }
          if (!src && FALLBACK_ARTICLE[a]) {
            try {
              src = await summary(FALLBACK_ARTICLE[a]);
            } catch {
              /* no photo for this ingredient */
            }
          }
          if (!src) return;
          const resp = await fetch(src, { referrerPolicy: 'no-referrer' });
          if (!resp.ok) return;
          const blob = await resp.blob();
          if (!blob.type.startsWith('image/')) return;
          const obj = URL.createObjectURL(blob);
          const ok = await new Promise<boolean>((res) => {
            const im = new Image();
            im.onload = () => res(true);
            im.onerror = () => res(false);
            im.src = obj;
          });
          if (ok) {
            out[a] = obj;
            objectUrls.current.push(obj);
          } else {
            URL.revokeObjectURL(obj);
          }
        } catch {
          /* medallion keeps its icon */
        }
      }),
    );
    setState((s) => ({ ...s, ingImgs: { ...s.ingImgs, ...out } }));
  }, []);

  const reloadIngredientImages = useCallback(() => {
    void loadIngredientImages(stateRef.current.products ?? PRODUCTS);
  }, [loadIngredientImages]);

  // Restore the on-device session, then start the entry splash countdown.
  useEffect(() => {
    const saved = read<Product[] | null>(KEYS.products, null);
    const restored: Partial<AppState> = {
      user: read<User | null>(KEYS.user, null),
      users: read<Account[]>(KEYS.users, DEFAULT_ACCOUNTS),
      orders: read<Order[]>(KEYS.orders, []),
      settings: read<Partial<Settings>>(KEYS.settings, {}),
      activity: read<Activity[]>(KEYS.activity, []),
      notifReadAt: readRaw(KEYS.notifRead) || '1970-01-01',
      products: Array.isArray(saved) && saved.length ? saved : null,
    };
    setState((s) => ({ ...s, ...restored }));
    void loadIngredientImages(restored.products ?? PRODUCTS);

    const onResize = () => setState((s) => (s.vw === window.innerWidth ? s : { ...s, vw: window.innerWidth }));
    window.addEventListener('resize', onResize);
    onResize();

    let timer: number | undefined;
    if (!CONFIG.showSplash) setState((s) => ({ ...s, splash: false }));
    else timer = window.setTimeout(() => setState((s) => ({ ...s, splash: false })), (CONFIG.splashSeconds + 1.2) * 1000);

    const urls = objectUrls;
    return () => {
      window.removeEventListener('resize', onResize);
      if (timer) clearTimeout(timer);
      urls.current.forEach((u) => URL.revokeObjectURL(u));
      urls.current = [];
    };
  }, [loadIngredientImages]);

  const toast = useCallback((message: string) => {
    setState((s) => ({ ...s, adminToast: message }));
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setState((s) => ({ ...s, adminToast: '' })), 1800);
  }, []);

  const saveProducts = useCallback(
    (list: Product[]) => {
      persist(KEYS.products, list);
      setState((s) => ({ ...s, products: list, adminEdit: null }));
      void loadIngredientImages(list);
      toast('Saved');
    },
    [loadIngredientImages, toast],
  );

  const resetCatalog = useCallback(() => {
    remove(KEYS.products);
    setState((s) => ({ ...s, products: null, adminEdit: null }));
    void loadIngredientImages(PRODUCTS);
  }, [loadIngredientImages]);

  const logActivity = useCallback((type: ActivityType, title: string, ref: string) => {
    setState((s) => {
      const next = [{ type, title, ref, date: new Date().toISOString() }, ...s.activity].slice(0, 50);
      persist(KEYS.activity, next);
      return { ...s, activity: next };
    });
  }, []);

  const signIn = useCallback((user: User) => {
    persist(KEYS.user, user);
    setState((s) => ({
      ...s,
      user,
      authOpen: false,
      authForm: {},
      authError: '',
      authNext: null,
      ...(s.authNext === 'checkout'
        ? {
            page: 'checkout' as Page,
            step: 1 as const,
            order: null,
            form: { ...s.form, name: user.name || '', email: user.email || '' },
          }
        : {}),
    }));
  }, []);

  const signOut = useCallback(() => {
    persist(KEYS.user, null);
    setState((s) => ({ ...s, user: null, page: s.page === 'admin' ? 'shop' : s.page }));
  }, []);

  const saveAccounts = useCallback((list: Account[]) => {
    persist(KEYS.users, list);
    setState((s) => ({ ...s, users: list }));
  }, []);

  const saveOrder = useCallback((order: Order) => {
    setState((s) => {
      const orders = [order, ...s.orders];
      persist(KEYS.orders, orders);
      return { ...s, orders, order, step: 4, cart: {} };
    });
  }, []);

  const saveSettings = useCallback(() => {
    const merged = { ...DEFAULT_SETTINGS, ...stateRef.current.settings };
    persist(KEYS.settings, merged);
    toast('Website details saved');
  }, [toast]);

  const markNotificationsRead = useCallback(() => {
    const t = new Date().toISOString();
    persistRaw(KEYS.notifRead, t);
    setState((s) => ({ ...s, notifReadAt: t }));
  }, []);

  const store = useMemo<Store>(
    () => ({
      state,
      set,
      products,
      settings,
      saveProducts,
      resetCatalog,
      logActivity,
      toast,
      signIn,
      signOut,
      saveAccounts,
      saveOrder,
      saveSettings,
      markNotificationsRead,
      reloadIngredientImages,
    }),
    [
      state,
      set,
      products,
      settings,
      saveProducts,
      resetCatalog,
      logActivity,
      toast,
      signIn,
      signOut,
      saveAccounts,
      saveOrder,
      saveSettings,
      markNotificationsRead,
      reloadIngredientImages,
    ],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

/** Breakpoints the design switches layout on. */
export function useLayout() {
  const { state } = useStore();
  const vw = state.vw;
  const mobile = vw < 760;
  const tight = vw < 480;
  return {
    mobile,
    tight,
    isDesktop: !mobile,
    pageGap: mobile ? '14px' : '20px',
    pagePad: tight ? '10px' : mobile ? '14px' : '20px',
    asideFlex: mobile ? '1 1 100%' : '0 0 240px',
    asidePad: mobile ? '12px 14px' : '28px 20px',
    asideGap: mobile ? '12px' : '24px',
    asidePos: (mobile ? 'relative' : 'sticky') as 'relative' | 'sticky',
    asideTop: mobile ? 'auto' : '20px',
    navDir: (mobile ? 'row' : 'column') as 'row' | 'column',
    mainBasis: mobile ? '100%' : '560px',
    radiusLg: tight ? '18px' : '28px',
    panelPad: tight ? '18px' : mobile ? '22px' : '32px',
    featuredH: tight ? '300px' : mobile ? '360px' : '420px',
    summaryPos: (mobile ? 'relative' : 'sticky') as 'relative' | 'sticky',
    drawerPad: mobile ? '0' : '16px',
  };
}
