/**
 * Every read and write against Supabase. Components never touch the client
 * directly; they go through the store, which calls these.
 */
import { supabase } from './supabase';
import { cloudinaryConfigured, uploadToCloudinary } from './cloudinary';
import { fromCents } from './format';
import type {
  Activity,
  ActivityType,
  Category,
  ContactMessage,
  IngredientRef,
  Order,
  PayId,
  Product,
  Profile,
  ProfileStatus,
  Settings,
  ShipId,
  User,
} from '../types';

const FALLBACK_IMG = '/assets/syrah.jpg';

// ---------------------------------------------------------------------------
// Row shapes (what PostgREST returns)
// ---------------------------------------------------------------------------
interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  sort: number;
}
interface ImageRow {
  url: string;
  sort: number;
}
interface IngredientRow {
  label: string;
  article: string;
  icon: string;
  image_url: string | null;
  sort: number;
}
interface ProductRow {
  id: string;
  name: string;
  category_id: string;
  country: string;
  origin: string;
  size: string;
  abv: string;
  price_cents: number;
  description: string;
  ingredients: string;
  stock: number;
  active: boolean;
  created_at: string;
  product_images: ImageRow[] | null;
  product_ingredients: IngredientRow[] | null;
}
interface SettingsRow {
  email: string;
  phone: string;
  hours: string;
  address: string;
  free_ship_cents: number;
  standard_ship_cents: number;
  express_ship_cents: number;
  momo_number: string;
  momo_name: string;
}
interface ProfileRow {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  phone: string;
  address: string;
  city: string;
  status: ProfileStatus;
  notifications_read_at: string;
  notifications_cleared_at: string;
  created_at: string;
}
interface OrderItemRow {
  product_id: string | null;
  name: string;
  unit_price_cents: number;
  qty: number;
}
interface OrderRow {
  id: string;
  order_no: string;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  ship_method: ShipId;
  pay_method: PayId;
  subtotal_cents: number;
  ship_cents: number;
  total_cents: number;
  item_count: number;
  status: Order['status'];
  payment_status: Order['paymentStatus'];
  created_at: string;
  order_items: OrderItemRow[] | null;
}
interface ActivityRow {
  id: string;
  type: ActivityType;
  title: string;
  ref: string;
  created_at: string;
}
interface MessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

const fail = (error: { message: string } | null): void => {
  if (error) throw new Error(error.message);
};

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------
const toProduct = (r: ProductRow, catName: Map<string, string>): Product => {
  const images = [...(r.product_images || [])].sort((a, b) => a.sort - b.sort).map((i) => i.url);
  const list: IngredientRef[] = [...(r.product_ingredients || [])]
    .sort((a, b) => a.sort - b.sort)
    .map((i) => ({ label: i.label, article: i.article, icon: i.icon, imageUrl: i.image_url }));
  return {
    id: r.id,
    name: r.name,
    category: catName.get(r.category_id) || r.category_id,
    categoryId: r.category_id,
    country: r.country,
    origin: r.origin,
    size: r.size,
    abv: r.abv,
    price: fromCents(r.price_cents),
    img: images[0] || FALLBACK_IMG,
    images,
    description: r.description,
    ingredients: r.ingredients,
    list,
    stock: r.stock,
    active: r.active,
    createdAt: r.created_at,
  };
};

export async function loadCatalog(): Promise<{ products: Product[]; categories: Category[] }> {
  const [cats, prods] = await Promise.all([
    supabase.from('categories').select('id, name, icon, sort').order('sort'),
    supabase
      .from('products')
      .select('*, product_images(url, sort), product_ingredients(label, article, icon, image_url, sort)')
      .order('created_at'),
  ]);
  fail(cats.error);
  fail(prods.error);
  const categories = ((cats.data || []) as CategoryRow[]).map((c) => ({ ...c }));
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const products = ((prods.data || []) as ProductRow[]).map((r) => toProduct(r, catName));
  return { products, categories };
}

export interface ProductInput {
  id: string;
  name: string;
  categoryId: string;
  country: string;
  origin: string;
  size: string;
  abv: string;
  priceCents: number;
  description: string;
  ingredients: string;
  stock: number;
  active: boolean;
}

/** Insert or update a bottle and replace its photos and medallions. */
export async function saveProduct(input: ProductInput, images: string[], list: IngredientRef[]): Promise<void> {
  const row = {
    id: input.id,
    name: input.name,
    category_id: input.categoryId,
    country: input.country,
    origin: input.origin,
    size: input.size,
    abv: input.abv,
    price_cents: input.priceCents,
    description: input.description,
    ingredients: input.ingredients,
    stock: input.stock,
    active: input.active,
  };
  fail((await supabase.from('products').upsert(row)).error);
  fail((await supabase.from('product_images').delete().eq('product_id', input.id)).error);
  if (images.length) {
    fail(
      (await supabase.from('product_images').insert(images.map((url, sort) => ({ product_id: input.id, url, sort })))).error,
    );
  }
  fail((await supabase.from('product_ingredients').delete().eq('product_id', input.id)).error);
  if (list.length) {
    fail(
      (
        await supabase.from('product_ingredients').insert(
          list.map((i, sort) => ({
            product_id: input.id,
            label: i.label,
            article: i.article,
            icon: i.icon,
            image_url: i.imageUrl || null,
            sort,
          })),
        )
      ).error,
    );
  }
}

export async function deleteProduct(id: string): Promise<void> {
  fail((await supabase.from('products').delete().eq('id', id)).error);
}

export interface CashSaleResult {
  orderNo: string;
  /** Cedis. */
  total: number;
  soldAt: string;
  /** Bottles left after the sale. */
  stock: number;
}

/**
 * A sale paid in cash at the counter: takes `qty` bottles out of stock and
 * records a paid order tagged "cash", dated `soldAt` (now when omitted), in
 * one atomic step. The database refuses if fewer bottles are left.
 */
export async function recordCashSale(productId: string, qty: number, soldAt?: string): Promise<CashSaleResult> {
  const { data, error } = await supabase.rpc('record_cash_sale', {
    p_product_id: productId,
    p_qty: qty,
    p_sold_at: soldAt ?? null,
  });
  fail(error);
  const r = data as { order_no: string; total_cents: number; sold_at: string; stock: number };
  return { orderNo: r.order_no, total: fromCents(r.total_cents), soldAt: r.sold_at, stock: r.stock };
}

export async function productIdExists(id: string): Promise<boolean> {
  const { data, error } = await supabase.from('products').select('id').eq('id', id).maybeSingle();
  fail(error);
  return !!data;
}

// ---------------------------------------------------------------------------
// Photos: Cloudinary holds the files, the database holds only the URL.
// Supabase Storage is the fallback until Cloudinary is configured.
// ---------------------------------------------------------------------------
const BUCKET = 'product-images';

async function uploadToStorage(path: string, file: Blob, upsert: boolean): Promise<string> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert,
  });
  fail(error);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadProductImage(productId: string, file: Blob, name: string): Promise<string> {
  const safe = name.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'photo';
  if (cloudinaryConfigured) return uploadToCloudinary(file, `casa-del-vino/products/${productId}`, `${Date.now()}-${safe}`);
  return uploadToStorage(`products/${productId}/${Date.now()}-${safe}.jpg`, file, false);
}

/** A photo the admin chose for one ingredient medallion. */
export async function uploadIngredientImage(productId: string, file: Blob, slug: string): Promise<string> {
  const name = `${slug}-${Date.now()}`;
  if (cloudinaryConfigured) return uploadToCloudinary(file, `casa-del-vino/ingredients/${productId}`, name);
  return uploadToStorage(`ingredients/${productId}/${name}.jpg`, file, true);
}

/** The lead photo of a Wikipedia article, exactly as served (resizing it is rejected). */
export async function fetchWikipediaThumbnail(article: string): Promise<Blob | null> {
  try {
    const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(article));
    if (!r.ok) return null;
    const j = (await r.json()) as { thumbnail?: { source?: string } };
    const src = j.thumbnail?.source;
    if (!src) return null;
    const resp = await fetch(src, { referrerPolicy: 'no-referrer' });
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return blob.type.startsWith('image/') ? blob : null;
  } catch {
    return null;
  }
}

/** Cache an ingredient photo on the CDN so the shop no longer depends on Wikipedia at runtime. */
export async function cacheIngredientImage(productId: string, article: string): Promise<string | null> {
  const blob = await fetchWikipediaThumbnail(article);
  if (!blob) return null;
  const slug = article.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'ingredient';
  try {
    if (cloudinaryConfigured) return await uploadToCloudinary(blob, `casa-del-vino/ingredients/${productId}`, slug);
    const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    return await uploadToStorage(`ingredients/${productId}/${slug}.${ext}`, blob, true);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
const toSettings = (r: SettingsRow): Settings => ({
  email: r.email,
  phone: r.phone,
  hours: r.hours,
  address: r.address,
  freeShip: fromCents(r.free_ship_cents),
  standardShip: fromCents(r.standard_ship_cents),
  expressShip: fromCents(r.express_ship_cents),
  momoNumber: r.momo_number ?? '',
  momoName: r.momo_name ?? '',
});

export async function loadSettings(): Promise<Settings | null> {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
  fail(error);
  return data ? toSettings(data as SettingsRow) : null;
}

export async function saveSettings(s: Settings): Promise<void> {
  fail(
    (
      await supabase
        .from('settings')
        .update({
          email: s.email,
          phone: s.phone,
          hours: s.hours,
          address: s.address,
          free_ship_cents: Math.round(s.freeShip * 100),
          standard_ship_cents: Math.round(s.standardShip * 100),
          express_ship_cents: Math.round(s.expressShip * 100),
          momo_number: s.momoNumber,
          momo_name: s.momoName,
        })
        .eq('id', 1)
    ).error,
  );
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------
const toUser = (r: ProfileRow): User => ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role,
  phone: r.phone,
  address: r.address,
  city: r.city,
  status: r.status || 'active',
  notifReadAt: r.notifications_read_at,
  notifClearedAt: r.notifications_cleared_at || '',
});

export async function loadMyProfile(id: string): Promise<User | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  fail(error);
  return data ? toUser(data as ProfileRow) : null;
}

export async function updateMyProfile(
  id: string,
  patch: { name?: string; phone?: string; address?: string; city?: string },
): Promise<void> {
  fail((await supabase.from('profiles').update(patch).eq('id', id)).error);
}

export async function markNotificationsRead(id: string): Promise<string> {
  const t = new Date().toISOString();
  fail((await supabase.from('profiles').update({ notifications_read_at: t }).eq('id', id)).error);
  return t;
}

/** "Clear all" on the bell: everything dated up to now disappears from it. */
export async function clearNotifications(id: string): Promise<string> {
  const t = new Date().toISOString();
  fail((await supabase.from('profiles').update({ notifications_cleared_at: t, notifications_read_at: t }).eq('id', id)).error);
  return t;
}

/** The single bell items this user has dismissed, by their keys. */
export async function loadDismissedNotifications(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('notification_dismissals').select('key').eq('user_id', userId);
  fail(error);
  return ((data || []) as { key: string }[]).map((r) => r.key);
}

export async function dismissNotification(userId: string, key: string): Promise<void> {
  fail((await supabase.from('notification_dismissals').upsert({ user_id: userId, key })).error);
}

export async function loadProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  fail(error);
  return ((data || []) as ProfileRow[]).map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    phone: r.phone,
    address: r.address,
    city: r.city,
    status: r.status || 'active',
    createdAt: r.created_at,
  }));
}

/** Deactivate or restore a customer. The account is never deleted. */
export async function setProfileStatus(id: string, status: ProfileStatus): Promise<void> {
  fail((await supabase.from('profiles').update({ status }).eq('id', id)).error);
}

// ---------------------------------------------------------------------------
// Cart and wishlist (signed-in customers)
// ---------------------------------------------------------------------------
export async function loadCart(userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('cart_items').select('product_id, qty').eq('user_id', userId);
  fail(error);
  return Object.fromEntries(((data || []) as { product_id: string; qty: number }[]).map((r) => [r.product_id, r.qty]));
}

export async function setCartItem(userId: string, productId: string, qty: number): Promise<void> {
  if (qty <= 0) {
    fail((await supabase.from('cart_items').delete().match({ user_id: userId, product_id: productId })).error);
  } else {
    fail(
      (
        await supabase
          .from('cart_items')
          .upsert({ user_id: userId, product_id: productId, qty, updated_at: new Date().toISOString() })
      ).error,
    );
  }
}

export async function clearCart(userId: string): Promise<void> {
  fail((await supabase.from('cart_items').delete().eq('user_id', userId)).error);
}

export async function mergeCart(userId: string, local: Record<string, number>): Promise<void> {
  const rows = Object.entries(local)
    .filter(([, q]) => q > 0)
    .map(([product_id, qty]) => ({ user_id: userId, product_id, qty }));
  if (rows.length) fail((await supabase.from('cart_items').upsert(rows)).error);
}

export async function loadWishlist(userId: string): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.from('wishlist_items').select('product_id').eq('user_id', userId);
  fail(error);
  return Object.fromEntries(((data || []) as { product_id: string }[]).map((r) => [r.product_id, true]));
}

export async function setWishlistItem(userId: string, productId: string, on: boolean): Promise<void> {
  if (on) {
    fail((await supabase.from('wishlist_items').upsert({ user_id: userId, product_id: productId })).error);
  } else {
    fail((await supabase.from('wishlist_items').delete().match({ user_id: userId, product_id: productId })).error);
  }
}

export async function clearWishlist(userId: string): Promise<void> {
  fail((await supabase.from('wishlist_items').delete().eq('user_id', userId)).error);
}

export async function mergeWishlist(userId: string, local: Record<string, boolean>): Promise<void> {
  const rows = Object.keys(local)
    .filter((id) => local[id])
    .map((product_id) => ({ user_id: userId, product_id }));
  if (rows.length) fail((await supabase.from('wishlist_items').upsert(rows)).error);
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
const toOrder = (r: OrderRow): Order => ({
  id: r.id,
  no: r.order_no,
  userId: r.user_id,
  customer: r.customer_name,
  email: r.email,
  phone: r.phone,
  address: r.address,
  city: r.city,
  ship: r.ship_method,
  pay: r.pay_method,
  subtotal: fromCents(r.subtotal_cents),
  shipCost: fromCents(r.ship_cents),
  total: fromCents(r.total_cents),
  count: r.item_count,
  status: r.status,
  paymentStatus: r.payment_status,
  date: r.created_at,
  lines: (r.order_items || []).map((i) => ({ id: i.product_id, name: i.name, qty: i.qty, price: fromCents(i.unit_price_cents) })),
});

export interface PlaceOrderInput {
  items: { product_id: string; qty: number }[];
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  ship: ShipId;
  pay: PayId;
}

interface PlacedOrder {
  id: string;
  order_no: string;
  subtotal_cents: number;
  ship_cents: number;
  total_cents: number;
  item_count: number;
  status: Order['status'];
  payment_status: Order['paymentStatus'];
  created_at: string;
}

/** Bank transfer and pay-on-delivery orders: created straight in the database. */
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const { data, error } = await supabase.rpc('place_order', {
    p_items: input.items,
    p_customer_name: input.customer_name,
    p_email: input.email,
    p_phone: input.phone,
    p_address: input.address,
    p_city: input.city,
    p_ship: input.ship,
    p_pay: input.pay,
  });
  fail(error);
  return data as PlacedOrder;
}

/** Card orders: the edge function creates the order, then hands back a Stripe Checkout URL. */
export async function createCheckoutSession(input: Omit<PlaceOrderInput, 'pay'>): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>('create-checkout-session', {
    body: input,
  });
  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error(data?.error || 'Could not start the card payment');
  return data.url;
}

/** Own orders for a customer; every order for an admin (row security decides). */
export async function loadOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(product_id, name, unit_price_cents, qty)')
    .order('created_at', { ascending: false });
  fail(error);
  return ((data || []) as OrderRow[]).map(toOrder);
}

export async function findOrderByNo(no: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(product_id, name, unit_price_cents, qty)')
    .eq('order_no', no)
    .maybeSingle();
  fail(error);
  return data ? toOrder(data as OrderRow) : null;
}

export async function updateOrder(
  id: string,
  patch: { status?: Order['status']; payment_status?: Order['paymentStatus'] },
): Promise<void> {
  fail((await supabase.from('orders').update(patch).eq('id', id)).error);
}

// ---------------------------------------------------------------------------
// Contact messages and the admin activity log
// ---------------------------------------------------------------------------
export async function sendContactMessage(m: { name: string; email: string; subject: string; message: string }): Promise<void> {
  fail((await supabase.from('contact_messages').insert(m)).error);
}

export async function loadMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(100);
  fail(error);
  return ((data || []) as MessageRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    subject: r.subject,
    message: r.message,
    read: r.read,
    date: r.created_at,
  }));
}

export async function markMessageRead(id: string, read: boolean): Promise<void> {
  fail((await supabase.from('contact_messages').update({ read }).eq('id', id)).error);
}

export async function logActivity(type: ActivityType, title: string, ref: string): Promise<void> {
  fail((await supabase.from('activity_log').insert({ type, title, ref })).error);
}

export async function loadActivity(): Promise<Activity[]> {
  const { data, error } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(50);
  fail(error);
  return ((data || []) as ActivityRow[]).map((r) => ({ id: r.id, type: r.type, title: r.title, ref: r.ref, date: r.created_at }));
}
