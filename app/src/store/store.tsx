import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import * as api from "../lib/api";
import { errorMessage } from "../lib/format";
import { KEYS, persist, read, remove } from "../lib/storage";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { CONFIG } from "../data/catalog";
import type {
  Activity,
  ActivityType,
  AdminTab,
  AuthMode,
  Category,
  CheckoutForm,
  ContactMessage,
  Order,
  Page,
  PayId,
  Product,
  ProductDraft,
  Profile,
  ProfileStatus,
  Settings,
  ShipId,
  User,
} from "../types";

/** Shown until the `settings` row loads; the seed writes the same values. */
const DEFAULT_SETTINGS: Settings = {
  email: "info@casadelvino.shop",
  phone: "+34 600 000 000",
  hours: "Mon–Sat, 10:00–20:00",
  address: "Calle del Vino 12, Madrid",
  freeShip: 60,
  standardShip: 6.9,
  expressShip: 12.9,
  momoNumber: "",
  momoName: "Felix Sowah",
};

const EMPTY_FORM: CheckoutForm = {
  name: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  adult: false,
};

const ADMIN_TABS: AdminTab[] = [
  "dashboard",
  "products",
  "orders",
  "customers",
  "messages",
  "settings",
];

export interface AppState {
  // catalog
  products: Product[];
  categories: Category[];
  catalogLoaded: boolean;
  catalogError: string;
  settings: Settings;

  // entry and page chrome
  splash: boolean;
  adult: boolean;
  query: string;
  galleryIdx: number;
  zoomOpen: boolean;
  sent: boolean;

  // bag and wishlist
  wish: Record<string, boolean>;
  cart: Record<string, number>;
  cartOpen: boolean;

  // checkout
  step: 1 | 2 | 3 | 4;
  ship: ShipId;
  pay: PayId;
  form: CheckoutForm;
  order: Order | null;
  checkoutError: string;
  placing: boolean;

  // account
  user: User | null;
  authReady: boolean;
  authOpen: boolean;
  authMode: AuthMode;
  authForm: { name?: string; email?: string; password?: string };
  authError: string;
  authNotice: string;
  authBusy: boolean;
  authNext: "checkout" | null;
  showPw: boolean;
  myOrders: Order[];
  myOrdersLoaded: boolean;

  // admin
  orders: Order[];
  profiles: Profile[];
  activity: Activity[];
  messages: ContactMessage[];
  adminLoaded: boolean;
  adminEdit: ProductDraft | null;
  adminQuery: string;
  /** Category id chosen from the sidebar shelves; narrows the products tab. */
  adminShelf: string | null;
  adminToast: string;
  adminBusy: boolean;
  notifOpen: boolean;
  /** Keys of the bell items this admin dismissed one by one. */
  dismissedNotifs: string[];

  // featured-panel effects
  ingImgs: Record<string, string>;
  hoverChip: string | null;
  tilt: { x: number; y: number; gx: number; gy: number };
  vw: number;
}

/** Read from the URL rather than kept in state. */
export interface RouteState {
  page: Page;
  cat: string;
  featuredId: string | null;
  adminTab: AdminTab;
}

export type FullState = AppState & RouteState;

const initialState: AppState = {
  products: [],
  categories: [],
  catalogLoaded: false,
  catalogError: "",
  settings: DEFAULT_SETTINGS,
  splash: CONFIG.showSplash,
  adult: read<boolean>(KEYS.adult, false),
  query: "",
  galleryIdx: 0,
  zoomOpen: false,
  sent: false,
  wish: read<Record<string, boolean>>(KEYS.wish, {}),
  cart: read<Record<string, number>>(KEYS.cart, {}),
  cartOpen: false,
  step: 1,
  ship: "standard",
  pay: "momo",
  form: EMPTY_FORM,
  order: null,
  checkoutError: "",
  placing: false,
  user: null,
  authReady: false,
  authOpen: false,
  authMode: "signin",
  authForm: {},
  authError: "",
  authNotice: "",
  authBusy: false,
  authNext: null,
  showPw: false,
  myOrders: [],
  myOrdersLoaded: false,
  orders: [],
  profiles: [],
  activity: [],
  messages: [],
  adminLoaded: false,
  adminEdit: null,
  adminQuery: "",
  adminShelf: null,
  adminToast: "",
  adminBusy: false,
  notifOpen: false,
  dismissedNotifs: [],
  ingImgs: {},
  hoverChip: null,
  tilt: { x: 0, y: 0, gx: 50, gy: 50 },
  vw: typeof window === "undefined" ? 1200 : window.innerWidth,
};

type Patch = Partial<AppState> | ((s: AppState) => Partial<AppState> | null);

/** URL builders, so no component spells a path by hand. */
export const routes = {
  shop: (catSlug?: string) =>
    catSlug && catSlug !== "all" ? `/shop/${catSlug}` : "/",
  product: (id: string) => `/product/${id}`,
  admin: (tab: AdminTab = "dashboard") =>
    tab === "dashboard" ? "/admin" : `/admin/${tab}`,
  about: "/about",
  contact: "/contact",
  wishlist: "/wishlist",
  account: "/account",
  checkout: "/checkout",
  success: "/checkout/success",
  legal: "/legal",
  reset: "/reset-password",
};

function readRoute(pathname: string, categories: Category[]): RouteState {
  const out: RouteState = {
    page: "shop",
    cat: "All",
    featuredId: null,
    adminTab: "dashboard",
  };
  let m;
  if (pathname === "/") return out;
  if ((m = matchPath("/shop/:cat", pathname))) {
    const c = categories.find((x) => x.id === m!.params.cat);
    out.cat = c ? c.name : "All";
    return out;
  }
  if ((m = matchPath("/product/:id", pathname))) {
    out.featuredId = m.params.id ?? null;
    return out;
  }
  if (pathname === "/checkout/success") return { ...out, page: "success" };
  if ((m = matchPath("/admin/:tab?", pathname))) {
    const tab = m.params.tab as AdminTab | undefined;
    return {
      ...out,
      page: "admin",
      adminTab: tab && ADMIN_TABS.includes(tab) ? tab : "dashboard",
    };
  }
  if (pathname === "/reset-password") return { ...out, page: "reset" };
  const simple = pathname.replace(/^\//, "").replace(/\/$/, "") as Page;
  if (
    (
      ["about", "contact", "wishlist", "account", "checkout", "legal"] as Page[]
    ).includes(simple)
  ) {
    return { ...out, page: simple };
  }
  return out;
}

export interface Store {
  state: FullState;
  set: (patch: Patch) => void;
  /** Navigate. Use the `routes` builders for paths. */
  go: (path: string, opts?: { replace?: boolean }) => void;
  products: Product[];
  settings: Settings;
  /** Slug of the shelf currently shown, for building links. */
  catSlug: string;

  // catalog
  reloadCatalog: () => Promise<void>;

  // bag and wishlist
  setCartQty: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleWish: (id: string) => void;
  clearWishlist: () => void;

  // account
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  saveMyDetails: (patch: {
    name: string;
    phone: string;
    address: string;
    city: string;
  }) => Promise<void>;
  loadMyOrders: () => Promise<void>;

  // checkout
  placeOrder: () => Promise<void>;
  startCardPayment: () => Promise<void>;

  // admin
  loadAdminData: () => Promise<void>;
  saveSettings: (s: Settings) => Promise<void>;
  logActivity: (
    type: ActivityType,
    title: string,
    ref: string,
  ) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  /** Empty the bell: everything up to now is hidden and counted as read. */
  clearNotifications: () => Promise<void>;
  /** Hide one bell item. */
  dismissNotification: (key: string) => Promise<void>;
  /** Deactivate or restore a customer account; nothing is deleted. */
  setProfileStatus: (id: string, status: ProfileStatus) => Promise<void>;
  toast: (message: string) => void;
  /** Re-fetch the floating ingredient photos (after a catalog change). */
  reloadIngredientImages: () => void;

  confirmAdult: () => void;
}

const StoreContext = createContext<Store | null>(null);

const FALLBACK_ARTICLE: Record<string, string> = {
  Ristafallet: "Waterfall",
  Steall_Waterfall: "Waterfall",
  Orujo: "Brandy",
  Åhus: "Sweden",
};

const isDbUser = (u: User | null): u is User & { id: string } =>
  !!u && !!u.id && u.role !== "guest";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const toastTimer = useRef<number | undefined>(undefined);
  const objectUrls = useRef<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const set = useCallback((patch: Patch) => {
    setState((s) => {
      const next = typeof patch === "function" ? patch(s) : patch;
      return next ? { ...s, ...next } : s;
    });
  }, []);

  const go = useCallback(
    (path: string, opts?: { replace?: boolean }) => {
      navigate(path, opts);
    },
    [navigate],
  );

  const route = useMemo(
    () => readRoute(location.pathname, state.categories),
    [location.pathname, state.categories],
  );
  const catSlug = useMemo(
    () => state.categories.find((c) => c.name === route.cat)?.id ?? "all",
    [state.categories, route.cat],
  );

  // Scroll to the top on every page change, as the design's in-page navigation did.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const toast = useCallback((message: string) => {
    setState((s) => ({ ...s, adminToast: message }));
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(
      () => setState((s) => ({ ...s, adminToast: "" })),
      2200,
    );
  }, []);

  // ---------------------------------------------------------------------------
  // Ingredient medallion photos: cached URL first, Wikipedia as a fallback.
  // ---------------------------------------------------------------------------
  const loadIngredientImages = useCallback(async (list: Product[]) => {
    const articles = [
      ...new Set(
        list.flatMap((p) =>
          (p.list || [])
            .filter((x) => !x.imageUrl && x.article)
            .map((x) => x.article),
        ),
      ),
    ].filter((a) => !stateRef.current.ingImgs[a]);
    if (!articles.length) return;
    const out: Record<string, string> = {};
    await Promise.all(
      articles.map(async (a) => {
        try {
          let blob = await api.fetchWikipediaThumbnail(a);
          if (!blob && FALLBACK_ARTICLE[a])
            blob = await api.fetchWikipediaThumbnail(FALLBACK_ARTICLE[a]);
          if (!blob) return;
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
    if (Object.keys(out).length)
      setState((s) => ({ ...s, ingImgs: { ...s.ingImgs, ...out } }));
  }, []);

  const reloadIngredientImages = useCallback(() => {
    void loadIngredientImages(stateRef.current.products);
  }, [loadIngredientImages]);

  // ---------------------------------------------------------------------------
  // Catalog and settings
  // ---------------------------------------------------------------------------
  const reloadCatalog = useCallback(async () => {
    if (!supabaseConfigured) {
      setState((s) => ({
        ...s,
        catalogLoaded: true,
        catalogError:
          "Supabase is not configured. Copy .env.example to .env.local.",
      }));
      return;
    }
    try {
      const [{ products, categories }, settings] = await Promise.all([
        api.loadCatalog(),
        api.loadSettings(),
      ]);
      setState((s) => ({
        ...s,
        products,
        categories,
        settings: settings ?? s.settings,
        catalogLoaded: true,
        catalogError: "",
      }));
      void loadIngredientImages(products);
    } catch (e) {
      setState((s) => ({
        ...s,
        catalogLoaded: true,
        catalogError: errorMessage(e, "Could not load the cellar"),
      }));
    }
  }, [loadIngredientImages]);

  // ---------------------------------------------------------------------------
  // Bag and wishlist: local for guests, database for customers.
  // ---------------------------------------------------------------------------
  const setCartQty = useCallback((id: string, qty: number) => {
    const u = stateRef.current.user;
    setState((s) => {
      const cart = { ...s.cart };
      if (qty <= 0) delete cart[id];
      else cart[id] = qty;
      if (!isDbUser(u)) persist(KEYS.cart, cart);
      return { ...s, cart };
    });
    if (isDbUser(u)) void api.setCartItem(u.id, id, qty).catch(() => {});
  }, []);

  const clearCart = useCallback(() => {
    const u = stateRef.current.user;
    setState((s) => ({ ...s, cart: {} }));
    persist(KEYS.cart, {});
    if (isDbUser(u)) void api.clearCart(u.id).catch(() => {});
  }, []);

  const toggleWish = useCallback((id: string) => {
    const u = stateRef.current.user;
    const on = !stateRef.current.wish[id];
    setState((s) => {
      const wish = { ...s.wish };
      if (on) wish[id] = true;
      else delete wish[id];
      if (!isDbUser(u)) persist(KEYS.wish, wish);
      return { ...s, wish };
    });
    if (isDbUser(u)) void api.setWishlistItem(u.id, id, on).catch(() => {});
  }, []);

  const clearWishlist = useCallback(() => {
    const u = stateRef.current.user;
    setState((s) => ({ ...s, wish: {} }));
    persist(KEYS.wish, {});
    if (isDbUser(u)) void api.clearWishlist(u.id).catch(() => {});
  }, []);

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  const applySession = useCallback(
    async (session: Session | null) => {
      if (!session) {
        const guest = read<boolean>(KEYS.guest, false);
        setState((s) => ({
          ...s,
          authReady: true,
          user: guest
            ? {
                id: null,
                name: "Guest",
                email: "",
                role: "guest",
                phone: "",
                address: "",
                city: "",
                status: "active",
                notifReadAt: "",
                notifClearedAt: "",
              }
            : null,
          cart: read<Record<string, number>>(KEYS.cart, {}),
          wish: read<Record<string, boolean>>(KEYS.wish, {}),
          myOrders: [],
          myOrdersLoaded: false,
        }));
        return;
      }
      try {
        let profile = await api.loadMyProfile(session.user.id);
        if (!profile) {
          // The trigger normally creates it; if not, fall back to the auth record.
          profile = {
            id: session.user.id,
            name:
              (session.user.user_metadata?.name as string) ||
              session.user.email?.split("@")[0] ||
              "",
            email: session.user.email || "",
            role: "customer",
            phone: "",
            address: "",
            city: "",
            status: "active",
            notifReadAt: "",
            notifClearedAt: "",
          };
        }
        if (profile.status === "inactive") {
          // Deactivated by the admin: the account stays on file but cannot be used.
          await supabase.auth.signOut();
          setState((s) => ({
            ...s,
            authReady: true,
            authBusy: false,
            authOpen: true,
            authMode: "signin",
            authNext: null,
            authError:
              "This account has been deactivated. Please contact us if you think this is a mistake.",
          }));
          return;
        }
        // Carry a guest's bag and hearts into the account, then read back the merged lists.
        const localCart = read<Record<string, number>>(KEYS.cart, {});
        const localWish = read<Record<string, boolean>>(KEYS.wish, {});
        const uid = session.user.id;
        await Promise.all([
          api.mergeCart(uid, localCart),
          api.mergeWishlist(uid, localWish),
        ]).catch(() => {});
        remove(KEYS.cart);
        remove(KEYS.wish);
        remove(KEYS.guest);
        const [cart, wish] = await Promise.all([
          api.loadCart(uid).catch(() => localCart),
          api.loadWishlist(uid).catch(() => localWish),
        ]);
        const next = stateRef.current.authNext;
        setState((s) => ({
          ...s,
          authReady: true,
          user: profile,
          cart,
          wish,
          authOpen: false,
          authForm: {},
          authError: "",
          authNotice: "",
          authBusy: false,
          authNext: null,
          form: {
            ...s.form,
            name: s.form.name || profile!.name,
            email: s.form.email || profile!.email,
            phone: s.form.phone || profile!.phone,
            address: s.form.address || profile!.address,
            city: s.form.city || profile!.city,
          },
        }));
        if (next === "checkout") go(routes.checkout);
      } catch (e) {
        setState((s) => ({
          ...s,
          authReady: true,
          authBusy: false,
          authError: errorMessage(e, "Could not load your account"),
        }));
      }
    },
    [go],
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({
        ...s,
        authBusy: true,
        authError: "",
        authNotice: "",
      }));
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error)
        setState((s) => ({ ...s, authBusy: false, authError: error.message }));
      // success: onAuthStateChange → applySession
    },
    [],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      setState((s) => ({
        ...s,
        authBusy: true,
        authError: "",
        authNotice: "",
      }));
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        setState((s) => ({ ...s, authBusy: false, authError: error.message }));
        return;
      }
      if (!data.session) {
        // Email confirmation is on in the project: tell them to check their inbox.
        setState((s) => ({
          ...s,
          authBusy: false,
          authMode: "signin",
          authNotice: "Check your inbox and confirm your email, then sign in.",
        }));
      }
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    setState((s) => ({ ...s, authBusy: true, authError: "", authNotice: "" }));
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          window.location.origin +
          (stateRef.current.authNext === "checkout" ? routes.checkout : "/"),
      },
    });
    if (error)
      setState((s) => ({ ...s, authBusy: false, authError: error.message }));
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!email.trim()) {
      setState((s) => ({ ...s, authError: "Enter your email address first." }));
      return;
    }
    setState((s) => ({ ...s, authBusy: true, authError: "", authNotice: "" }));
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: window.location.origin + routes.reset,
      },
    );
    setState((s) => ({
      ...s,
      authBusy: false,
      authError: error ? error.message : "",
      authNotice: error
        ? ""
        : "If that address has an account, a reset link is on its way.",
    }));
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  }, []);

  const continueAsGuest = useCallback(() => {
    persist(KEYS.guest, true);
    const next = stateRef.current.authNext;
    setState((s) => ({
      ...s,
      user: {
        id: null,
        name: "Guest",
        email: "",
        role: "guest",
        phone: "",
        address: "",
        city: "",
        status: "active",
        notifReadAt: "",
        notifClearedAt: "",
      },
      authOpen: false,
      authError: "",
      authNotice: "",
      authNext: null,
    }));
    if (next === "checkout") go(routes.checkout);
  }, [go]);

  const signOut = useCallback(async () => {
    const wasDb = isDbUser(stateRef.current.user);
    remove(KEYS.guest);
    persist(KEYS.cart, {});
    persist(KEYS.wish, {});
    setState((s) => ({
      ...s,
      user: null,
      cart: wasDb ? {} : s.cart,
      wish: wasDb ? {} : s.wish,
      myOrders: [],
      myOrdersLoaded: false,
      orders: [],
      profiles: [],
      activity: [],
      messages: [],
      dismissedNotifs: [],
      adminLoaded: false,
      adminEdit: null,
    }));
    if (wasDb) await supabase.auth.signOut();
    const p = route.page;
    if (p === "admin" || p === "account") go("/");
  }, [go, route.page]);

  const saveMyDetails = useCallback(
    async (patch: {
      name: string;
      phone: string;
      address: string;
      city: string;
    }) => {
      const u = stateRef.current.user;
      if (!isDbUser(u)) return;
      await api.updateMyProfile(u.id, patch);
      setState((s) => ({
        ...s,
        user: s.user ? { ...s.user, ...patch } : s.user,
      }));
      toast("Details saved");
    },
    [toast],
  );

  const loadMyOrders = useCallback(async () => {
    const u = stateRef.current.user;
    if (!isDbUser(u)) return;
    try {
      const myOrders = await api.loadOrders();
      setState((s) => ({ ...s, myOrders, myOrdersLoaded: true }));
    } catch {
      setState((s) => ({ ...s, myOrdersLoaded: true }));
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Checkout
  // ---------------------------------------------------------------------------
  const orderInput = useCallback(() => {
    const s = stateRef.current;
    return {
      items: Object.entries(s.cart)
        .filter(([, q]) => q > 0)
        .map(([product_id, qty]) => ({ product_id, qty })),
      customer_name: s.form.name.trim(),
      email: s.form.email.trim(),
      phone: s.form.phone.trim(),
      address: s.form.address.trim(),
      city: s.form.city.trim(),
      ship: s.ship,
    };
  }, []);

  const placeOrder = useCallback(async () => {
    const s = stateRef.current;
    setState((x) => ({ ...x, placing: true, checkoutError: "" }));
    try {
      const placed = await api.placeOrder({ ...orderInput(), pay: s.pay });
      const lines = Object.entries(s.cart)
        .filter(([, q]) => q > 0)
        .map(([id, qty]) => {
          const p = s.products.find((x) => x.id === id);
          return { id, name: p?.name || id, qty, price: p?.price || 0 };
        });
      const order: Order = {
        id: placed.id,
        no: placed.order_no,
        userId: s.user?.id ?? null,
        lines,
        subtotal: placed.subtotal_cents / 100,
        shipCost: placed.ship_cents / 100,
        total: placed.total_cents / 100,
        count: placed.item_count,
        pay: s.pay,
        ship: s.ship,
        status: placed.status,
        paymentStatus: placed.payment_status,
        customer: s.form.name,
        email: s.form.email,
        phone: s.form.phone,
        address: s.form.address,
        city: s.form.city,
        date: placed.created_at,
      };
      persist(KEYS.cart, {});
      setState((x) => ({
        ...x,
        placing: false,
        order,
        step: 4,
        cart: {},
        myOrdersLoaded: false,
      }));
      void reloadCatalog(); // stock changed
    } catch (e) {
      setState((x) => ({
        ...x,
        placing: false,
        checkoutError: errorMessage(e, "Could not place the order"),
      }));
    }
  }, [orderInput, reloadCatalog]);

  const startCardPayment = useCallback(async () => {
    setState((x) => ({ ...x, placing: true, checkoutError: "" }));
    try {
      const url = await api.createCheckoutSession(orderInput());
      persist(KEYS.cart, {});
      window.location.assign(url);
    } catch (e) {
      setState((x) => ({
        ...x,
        placing: false,
        checkoutError: errorMessage(e, "Could not start the card payment"),
      }));
    }
  }, [orderInput]);

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------
  const loadAdminData = useCallback(async () => {
    const u = stateRef.current.user;
    try {
      const [orders, profiles, activity, messages, dismissedNotifs] =
        await Promise.all([
          api.loadOrders(),
          api.loadProfiles(),
          api.loadActivity(),
          api.loadMessages(),
          isDbUser(u)
            ? api
                .loadDismissedNotifications(u.id)
                .catch(() => stateRef.current.dismissedNotifs)
            : Promise.resolve([]),
        ]);
      setState((s) => ({
        ...s,
        orders,
        profiles,
        activity,
        messages,
        dismissedNotifs,
        adminLoaded: true,
      }));
    } catch (e) {
      setState((s) => ({ ...s, adminLoaded: true }));
      toast(errorMessage(e, "Could not load admin data"));
    }
  }, [toast]);

  const saveSettings = useCallback(
    async (s: Settings) => {
      await api.saveSettings(s);
      setState((x) => ({ ...x, settings: s }));
      toast("Website details saved");
    },
    [toast],
  );

  const logActivity = useCallback(
    async (type: ActivityType, title: string, ref: string) => {
      try {
        await api.logActivity(type, title, ref);
        const activity = await api.loadActivity();
        setState((s) => ({ ...s, activity }));
      } catch {
        /* the bell just misses one entry */
      }
    },
    [],
  );

  const markNotificationsRead = useCallback(async () => {
    const u = stateRef.current.user;
    if (!isDbUser(u)) return;
    const t = await api.markNotificationsRead(u.id);
    setState((s) => ({
      ...s,
      user: s.user ? { ...s.user, notifReadAt: t } : s.user,
    }));
  }, []);

  const clearNotifications = useCallback(async () => {
    const u = stateRef.current.user;
    if (!isDbUser(u)) return;
    const t = await api.clearNotifications(u.id);
    setState((s) => ({
      ...s,
      user: s.user ? { ...s.user, notifReadAt: t, notifClearedAt: t } : s.user,
    }));
  }, []);

  const dismissNotification = useCallback(
    async (key: string) => {
      const u = stateRef.current.user;
      if (!isDbUser(u)) return;
      // Hide it at once; the row is written behind it.
      setState((s) =>
        s.dismissedNotifs.includes(key)
          ? s
          : { ...s, dismissedNotifs: [...s.dismissedNotifs, key] },
      );
      try {
        await api.dismissNotification(u.id, key);
      } catch (e) {
        setState((s) => ({
          ...s,
          dismissedNotifs: s.dismissedNotifs.filter((k) => k !== key),
        }));
        toast(errorMessage(e, "Could not dismiss the notification"));
      }
    },
    [toast],
  );

  const setProfileStatus = useCallback(
    async (id: string, status: ProfileStatus) => {
      await api.setProfileStatus(id, status);
      setState((s) => ({
        ...s,
        profiles: s.profiles.map((p) => (p.id === id ? { ...p, status } : p)),
      }));
      toast(status === "inactive" ? "Account deactivated" : "Account restored");
    },
    [toast],
  );

  const confirmAdult = useCallback(() => {
    persist(KEYS.adult, true);
    setState((s) => ({ ...s, adult: true }));
  }, []);

  // ---------------------------------------------------------------------------
  // Boot: catalog, auth session, splash, resize.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    void reloadCatalog();

    let unsub = () => {};
    if (supabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY") navigate(routes.reset);
        if (event === "SIGNED_OUT") {
          void applySession(null);
          return;
        }
        if (
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          // Only re-run the profile load when the user actually changed.
          if (
            event === "TOKEN_REFRESHED" &&
            stateRef.current.user?.id === session?.user.id
          )
            return;
          void applySession(session);
        }
      });
      unsub = () => data.subscription.unsubscribe();
    } else {
      setState((s) => ({ ...s, authReady: true }));
    }

    const onResize = () =>
      setState((s) =>
        s.vw === window.innerWidth ? s : { ...s, vw: window.innerWidth },
      );
    window.addEventListener("resize", onResize);
    onResize();

    let timer: number | undefined;
    if (!CONFIG.showSplash) setState((s) => ({ ...s, splash: false }));
    else
      timer = window.setTimeout(
        () => setState((s) => ({ ...s, splash: false })),
        (CONFIG.splashSeconds + 1.2) * 1000,
      );

    const urls = objectUrls;
    return () => {
      unsub();
      window.removeEventListener("resize", onResize);
      if (timer) clearTimeout(timer);
      urls.current.forEach((u) => URL.revokeObjectURL(u));
      urls.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fullState = useMemo<FullState>(
    () => ({ ...state, ...route }),
    [state, route],
  );

  const store = useMemo<Store>(
    () => ({
      state: fullState,
      set,
      go,
      products: state.products,
      settings: state.settings,
      catSlug,
      reloadCatalog,
      setCartQty,
      clearCart,
      toggleWish,
      clearWishlist,
      signInWithPassword,
      signUp,
      signInWithGoogle,
      requestPasswordReset,
      updatePassword,
      continueAsGuest,
      signOut,
      saveMyDetails,
      loadMyOrders,
      placeOrder,
      startCardPayment,
      loadAdminData,
      saveSettings,
      logActivity,
      markNotificationsRead,
      clearNotifications,
      dismissNotification,
      setProfileStatus,
      toast,
      reloadIngredientImages,
      confirmAdult,
    }),
    [
      fullState,
      set,
      go,
      state.products,
      state.settings,
      catSlug,
      reloadCatalog,
      setCartQty,
      clearCart,
      toggleWish,
      clearWishlist,
      signInWithPassword,
      signUp,
      signInWithGoogle,
      requestPasswordReset,
      updatePassword,
      continueAsGuest,
      signOut,
      saveMyDetails,
      loadMyOrders,
      placeOrder,
      startCardPayment,
      loadAdminData,
      saveSettings,
      logActivity,
      markNotificationsRead,
      clearNotifications,
      dismissNotification,
      setProfileStatus,
      toast,
      reloadIngredientImages,
      confirmAdult,
    ],
  );

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

/** Breakpoints the design switches layout on. */
export function useLayout() {
  const { state } = useStore();
  const vw = state.vw;
  // Three tiers: phones stack everything, tablets (iPad Mini, iPad, Galaxy Tab)
  // keep the shelf rail on top with roomier spacing, and only from 1024px up
  // does the cellar sidebar sit beside the page.
  const tight = vw < 480;
  const mobile = vw < 760;
  const tablet = vw >= 760 && vw < 1024;
  const stacked = vw < 1024;
  return {
    mobile,
    tight,
    tablet,
    stacked,
    isDesktop: !stacked,
    pageGap: mobile ? "14px" : tablet ? "16px" : "20px",
    pagePad: tight ? "10px" : mobile ? "14px" : tablet ? "18px" : "20px",
    // Stacked: the shell is a column, so the rail sizes to its content and the page fills the rest.
    shellDir: (stacked ? "column" : "row") as "column" | "row",
    asideFlex: stacked ? "0 0 auto" : "0 0 240px",
    asideSelf: (stacked ? "stretch" : "flex-start") as "stretch" | "flex-start",
    asidePad: stacked ? (tablet ? "14px 18px" : "12px 14px") : "28px 20px",
    asideGap: stacked ? "12px" : "24px",
    asidePos: (stacked ? "relative" : "sticky") as "relative" | "sticky",
    asideTop: stacked ? "auto" : "20px",
    navDir: (stacked ? "row" : "column") as "row" | "column",
    // Beside the sidebar the page simply takes what is left; never wrap under it.
    mainBasis: stacked ? "auto" : "0px",
    radiusLg: tight ? "18px" : mobile ? "24px" : "28px",
    panelPad: tight ? "18px" : mobile ? "22px" : tablet ? "26px" : "32px",
    featuredH: tight ? "300px" : mobile ? "360px" : tablet ? "400px" : "420px",
    summaryPos: (stacked ? "relative" : "sticky") as "relative" | "sticky",
    drawerPad: mobile ? "0" : "16px",
  };
}
