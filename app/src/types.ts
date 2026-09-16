/** One floating ingredient medallion around the featured bottle. */
export interface IngredientRef {
  label: string;
  /** Wikipedia article used to find a photo when none is cached. */
  article: string;
  icon: string;
  /** Photo cached in storage by the admin, if any. */
  imageUrl?: string | null;
}

export interface Category {
  /** Slug, e.g. `red-wine`. Also the URL segment. */
  id: string;
  name: string;
  icon: string;
  sort: number;
}

export interface Product {
  /** Slug, e.g. `syrah`. Also the URL segment. */
  id: string;
  name: string;
  /** Category display name, kept for the filters and chips. */
  category: string;
  categoryId: string;
  country: string;
  origin: string;
  size: string;
  abv: string;
  /** Cedis. The database stores pesewas. */
  price: number;
  /** Cover photo (first of `images`). */
  img: string;
  images: string[];
  description: string;
  ingredients: string;
  list: IngredientRef[];
  stock: number;
  active: boolean;
  createdAt: string;
}

export type Role = 'admin' | 'customer' | 'guest';

/** The signed-in identity. Guests have no id. */
export interface User {
  id: string | null;
  name: string;
  email: string;
  role: Role;
  phone: string;
  address: string;
  city: string;
  status: ProfileStatus;
  notifReadAt: string;
  /** Everything dated at or before this was cleared from the bell. */
  notifClearedAt: string;
}

/** A deactivated account stays on file but can no longer sign in or order. */
export type ProfileStatus = 'active' | 'inactive';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  phone: string;
  address: string;
  city: string;
  status: ProfileStatus;
  createdAt: string;
}

export type ShipId = 'standard' | 'express' | 'pickup';
/** `cash`: paid at the counter and entered by the admin (Admin → Products → Cash); never offered at checkout. */
export type PayId = 'momo' | 'call' | 'card' | 'transfer' | 'cod' | 'cash';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderLine {
  id: string | null;
  name: string;
  qty: number;
  /** Cedis per bottle at the time of the order. */
  price: number;
}

export interface Order {
  id: string;
  no: string;
  userId: string | null;
  lines: OrderLine[];
  subtotal: number;
  shipCost: number;
  total: number;
  count: number;
  pay: PayId;
  ship: ShipId;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  date: string;
}

export type ActivityType = 'product-added' | 'product-updated' | 'product-removed';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  ref: string;
  date: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  date: string;
}

/** Shop-wide details the admin edits. Money in cedis. */
export interface Settings {
  email: string;
  phone: string;
  hours: string;
  address: string;
  freeShip: number;
  standardShip: number;
  /** Mobile-money account customers pay into (MTN MoMo / Telecel Cash). */
  momoNumber: string;
  /** Registered name on that account, shown so the customer can verify it before sending. */
  momoName: string;
  expressShip: number;
}

export interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  adult: boolean;
}

export type Page =
  | 'shop'
  | 'about'
  | 'contact'
  | 'wishlist'
  | 'account'
  | 'checkout'
  | 'success'
  | 'admin'
  | 'legal'
  | 'reset';

export type AdminTab = 'dashboard' | 'products' | 'orders' | 'customers' | 'messages' | 'settings';
export type AuthMode = 'signin' | 'signup';

export interface DraftImage {
  /** Public URL, or a local preview URL while `file` is still to be uploaded. */
  url: string;
  file?: File;
}

/** The product form's working copy: numbers stay strings while typed. */
export interface ProductDraft {
  id: string;
  name: string;
  categoryId: string;
  country: string;
  origin: string;
  size: string;
  abv: string;
  price: string;
  stock: string;
  active: boolean;
  images: DraftImage[];
  imgUrl?: string;
  description: string;
  ingredients: string;
  listText: string;
  /**
   * Per-ingredient photo choices, keyed by the lower-cased label:
   * a file to upload, `null` to drop the current photo and let the system
   * find one, or absent to keep whatever the bottle already has.
   */
  ingImages: Record<string, DraftImage | null>;
}
