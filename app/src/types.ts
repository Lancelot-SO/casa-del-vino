/** [label, wikipedia article, icon key] — the floating ingredient medallions. */
export type IngredientRef = [label: string, article: string, icon: string];

export interface Product {
  id: string;
  name: string;
  category: string;
  country: string;
  origin: string;
  size: string;
  abv: string;
  price: number;
  img: string;
  /** Admin-added bottles carry a gallery; the first entry is the cover. */
  images?: string[];
  description: string;
  ingredients: string;
  list: IngredientRef[];
}

export type Role = 'admin' | 'customer' | 'guest';

export interface Account {
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt?: string;
}

/** The signed-in identity — never carries the password. */
export interface User {
  name: string;
  email: string;
  role: Role;
}

export interface OrderLine {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  no: string;
  lines: OrderLine[];
  total: number;
  subtotal: number;
  shipCost: number;
  count: number;
  pay: PayId;
  ship: string;
  customer: string;
  email: string;
  date: string;
}

export type ActivityType = 'product-added' | 'product-updated' | 'product-removed';

export interface Activity {
  type: ActivityType;
  title: string;
  ref: string;
  date: string;
}

export interface Settings {
  email: string;
  phone: string;
  hours: string;
  address: string;
  freeShip: string;
}

export type ShipId = 'standard' | 'express' | 'pickup';
export type PayId = 'card' | 'transfer' | 'cod';

export interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  adult: boolean;
  card: string;
  cardName: string;
  exp: string;
  cvc: string;
}

export type Page = 'shop' | 'about' | 'contact' | 'wishlist' | 'account' | 'checkout' | 'admin';
export type AdminTab = 'dashboard' | 'products' | 'orders' | 'customers' | 'settings';
export type AuthMode = 'signin' | 'signup';

/** The product form's working copy: prices are typed, so they stay strings. */
export interface ProductDraft {
  id: string;
  name: string;
  category: string;
  country: string;
  origin: string;
  size: string;
  abv: string;
  price: string;
  img: string;
  images: string[];
  imgUrl?: string;
  description: string;
  ingredients: string;
  listText: string;
}
