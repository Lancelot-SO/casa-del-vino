import type { Product, Settings } from '../types';

/** The default cellar. "Restore defaults" in the admin brings these back. */
export const PRODUCTS: Product[] = [
  {
    id: 'syrah',
    name: 'Syrah — Vino Tinto',
    category: 'Red wine',
    country: 'Spain',
    origin: 'Spain',
    size: '75cl',
    abv: '13.5%',
    price: 12.5,
    img: 'assets/syrah.jpg',
    description:
      'Syrah is a rich, full-bodied red wine known for its deep dark color, bold fruit flavors, and signature peppery spice.',
    ingredients: 'Blackberry, blueberry, dark plum, black pepper and tobacco.',
    list: [
      ['Blackberry', 'Blackberry', 'berry'],
      ['Blueberry', 'Blueberry', 'berry'],
      ['Dark plum', 'Plum', 'plum'],
      ['Black pepper', 'Black_pepper', 'pepper'],
      ['Tobacco', 'Tobacco', 'leaf'],
    ],
  },
  {
    id: 'vermouth',
    name: 'Vermouth Rojo Gaztelu',
    category: 'Vermouth',
    country: 'Spain',
    origin: 'Spain',
    size: '1L',
    abv: '15%',
    price: 9.9,
    img: 'assets/vermouth.jpg',
    description:
      'A red vermouth made in Spain on a white-wine base with sugars, botanical aromas and a touch of caramel colour.',
    ingredients:
      'White wine (contains sulfites), sugars, ethyl alcohol of agricultural origin, water, aromas, dye (ammonium sulfite candy), conservatives and antioxidants (Potassium metabisulphite and L ascorbic acid), conservatives (Potassium sorbate), stabilizing agents (Metatartaric acid), acidity regulators (citric acid).',
    list: [
      ['White wine', 'White_wine', 'wine'],
      ['Sugars', 'Sugar', 'sugar'],
      ['Botanical aromas', 'Herb', 'leaf'],
      ['Water', 'Waterfall', 'drop'],
      ['Caramel colour', 'Caramel', 'sugar'],
    ],
  },
  {
    id: 'jb',
    name: 'J&B Rare Blended Scotch Whisky',
    category: 'Scotch whisky',
    country: 'Italy',
    origin: 'Italy',
    size: '70cl',
    abv: '40%',
    price: 21,
    img: 'assets/jb.jpg',
    description: 'A blend of the purest old scotch whiskey.',
    ingredients: 'Blended Scotch whisky.',
    list: [
      ['Malted barley', 'Barley', 'wheat'],
      ['Grain whisky', 'Scotch_whisky', 'wine'],
      ['Scottish water', 'Steall_Waterfall', 'drop'],
      ['Oak cask', 'Barrel', 'barrel'],
    ],
  },
  {
    id: 'absolut',
    name: 'Absolut Vodka',
    category: 'Vodka',
    country: 'Sweden',
    origin: 'Åhus, Sweden',
    size: '50ml',
    abv: '40%',
    price: 3.5,
    img: 'assets/absolut.jpg',
    description: 'Made with Swedish water and winter wheat, Absolut since 1879.',
    ingredients: 'Winter wheat, water.',
    list: [
      ['Winter wheat', 'Winter_wheat', 'wheat'],
      ['Swedish water', 'Ristafallet', 'drop'],
      ['Åhus, Sweden', 'Åhus', 'pin'],
    ],
  },
  {
    id: 'ruavieja',
    name: 'Ruavieja Crema de Orujo',
    category: 'Cream liqueur',
    country: 'Spain',
    origin: 'Galicia, Spain',
    size: '50ml',
    abv: '17%',
    price: 3.2,
    img: 'assets/ruavieja.jpg',
    description: 'A famous Spanish cream liqueur made in Galicia using traditional pomace brandy.',
    ingredients: 'Cream, pomace brandy (orujo), sugar.',
    list: [
      ['Cream', 'Cream', 'drop'],
      ['Orujo brandy', 'Orujo', 'wine'],
      ['Sugar', 'Sugar', 'sugar'],
      ['Galicia', 'Galicia_(Spain)', 'pin'],
    ],
  },
];

/** Line icons drawn in a medallion when no ingredient photo can be fetched. */
export const ING_ICON: Record<string, string> = {
  berry: 'M12 21a7 7 0 0 0 7-7c0-4-3-6-7-6s-7 2-7 6a7 7 0 0 0 7 7ZM12 8V4M12 4l3-2M12 4 9 2',
  plum: 'M12 21c5 0 8-3.5 8-8 0-4-3-7-8-7s-8 3-8 7c0 4.5 3 8 8 8ZM12 6c0-2 1-3 3-4',
  pepper: 'M8 9a4 4 0 1 1 8 0 4 4 0 1 1-8 0ZM6 16a3 3 0 1 0 6 0 3 3 0 1 0-6 0ZM15 17a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10ZM2 21c0-3 1.85-5.36 5.08-6',
  wine: 'M8 22h8M7 10h10M12 15v7M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z',
  sugar: 'M3 9l9-5 9 5-9 5-9-5ZM3 9v8l9 5 9-5V9M12 14v8',
  drop: 'M12 22a7 7 0 0 0 7-7c0-4-4-9-7-13-3 4-7 9-7 13a7 7 0 0 0 7 7Z',
  wheat: 'M12 22V8M12 8c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 8c3 0 5-2 5-5-3 0-5 2-5 5ZM12 14c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 14c3 0 5-2 5-5-3 0-5 2-5 5Z',
  barrel: 'M6 3h12c1 3 1.5 6 1.5 9s-.5 6-1.5 9H6c-1-3-1.5-6-1.5-9S5 6 6 3ZM4.5 9h15M4.5 15h15',
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 10m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
};

/** Category icons in the cellar sidebar. */
export const ICON: Record<string, string> = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  wine: 'M8 22h8M7 10h10M12 15v7M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z',
  martini: 'M8 22h8M12 11v11M19 3l-7 8-7-8Z',
  glass: 'M15.2 22H8.8a2 2 0 0 1-2-1.79L5 3h14l-1.81 17.21A2 2 0 0 1 15.2 22ZM6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0',
  cream: 'M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v3M10 2v3M14 2v3',
  whisky: 'M6 3h12l-1 18H7ZM6 10h12',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10ZM2 21c0-3 1.85-5.36 5.08-6',
};

export const CATEGORIES: [label: string, icon: string][] = [
  ['All', 'grid'],
  ['Red wine', 'wine'],
  ['White wine', 'wine'],
  ['Vermouth', 'martini'],
  ['Vodka', 'glass'],
  ['Cream liqueur', 'cream'],
  ['Scotch whisky', 'whisky'],
  ['Non-alcoholic red', 'leaf'],
  ['Non-alcoholic white', 'leaf'],
];

export const DEFAULT_SETTINGS: Settings = {
  email: 'hello@casadelvino.com',
  phone: '+34 600 000 000',
  hours: 'Mon–Sat, 10:00–20:00',
  address: 'Calle del Vino 12, Madrid',
  freeShip: '60',
};

/** The seed account list, used until a customer signs up. */
export const DEFAULT_ACCOUNTS = [
  { name: 'Admin', email: 'admin@casadelvino.com', password: 'admin', role: 'admin' as const },
];

/** Entry splash and medallion count — the design canvas exposed these as tweaks. */
export const CONFIG = {
  showSplash: true,
  splashSeconds: 3,
  maxIngredients: 5,
};
