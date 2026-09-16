import { useEffect } from 'react';
import { cdn } from '../lib/cloudinary';
import { useStore } from '../store/store';
import type { Product, Settings } from '../types';

/**
 * The document head for the page on screen: title, description, canonical
 * URL, Open Graph / Twitter cards, robots and JSON-LD structured data.
 * index.html carries site-wide defaults for scrapers that do not run
 * JavaScript; this keeps them in step with the route once the app is up.
 */

const SITE = 'Casa del Vino';
const TAGLINE = 'Good wine. Better company.';
const DEFAULT_DESC =
  'Premium wines and spirits, each listed honestly with its origin, strength, size and ingredients. Order online, pay by mobile money and have it delivered, or collect from the shop.';

interface Head {
  title: string;
  description: string;
  path: string;
  image: string;
  type: 'website' | 'product';
  noindex: boolean;
  /** Page-specific JSON-LD (a Product, a breadcrumb trail…). */
  ld: unknown;
}

function clip(s: string, n = 155): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
}

function abs(url: string): string {
  return /^https?:\/\//.test(url) ? url : window.location.origin + (url.startsWith('/') ? url : '/' + url);
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  if (el.content !== content) el.content = content;
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  if (el.href !== href) el.href = href;
}

function upsertJsonLd(id: string, data: unknown): void {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (data == null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  const text = JSON.stringify(data);
  if (el.textContent !== text) el.textContent = text;
}

function availability(p: Product): string {
  return p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
}

function productHead(p: Product, catSlug: string): Head {
  const url = abs(`/product/${p.id}`);
  const image = abs(cdn(p.img, 1200));
  const desc = clip(
    p.description ||
      `${p.name}: ${[p.category, p.origin || p.country, p.abv && `${p.abv} ABV`, p.size].filter(Boolean).join(' · ')}. ${DEFAULT_DESC}`,
  );
  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: p.images.length ? p.images.map((u) => abs(cdn(u, 1200))) : [image],
    description: desc,
    sku: p.id,
    category: p.category,
    url,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'GHS',
      price: p.price.toFixed(2),
      availability: availability(p),
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE },
    },
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Shop', item: abs('/') },
      { '@type': 'ListItem', position: 2, name: p.category, item: abs(`/shop/${catSlug || p.categoryId}`) },
      { '@type': 'ListItem', position: 3, name: p.name, item: url },
    ],
  };
  return {
    title: `${p.name} — ${p.category} | ${SITE}`,
    description: desc,
    path: `/product/${p.id}`,
    image,
    type: 'product',
    noindex: false,
    ld: [product, crumbs],
  };
}

function siteLd(settings: Settings): unknown {
  const origin = window.location.origin;
  return {
    '@context': 'https://schema.org',
    '@type': 'LiquorStore',
    '@id': origin + '/#store',
    name: SITE,
    alternateName: 'The house of wine',
    slogan: TAGLINE,
    url: origin + '/',
    logo: origin + '/assets/logo.jpg',
    image: origin + '/assets/logo.jpg',
    telephone: settings.phone || undefined,
    email: settings.email || undefined,
    address: settings.address ? { '@type': 'PostalAddress', streetAddress: settings.address } : undefined,
    openingHours: settings.hours || undefined,
    currenciesAccepted: 'GHS',
    paymentAccepted: 'Mobile money, Cash',
  };
}

const PLAIN: Record<string, { title: string; description: string; noindex: boolean }> = {
  about: { title: `About ${SITE} — ${TAGLINE}`, description: `${SITE}, the house of wine: a cellar built on one idea, that a bottle should be honest about what it is. Who we are, where we source, and how we deliver.`, noindex: false },
  contact: { title: `Contact ${SITE}`, description: `Phone, email, opening hours and address for ${SITE}. Send us a message about an order, a bottle or a delivery.`, noindex: false },
  legal: { title: `Terms, privacy & returns — ${SITE}`, description: `Who can buy, prices and payment, delivery, returns, privacy and cookies at ${SITE}.`, noindex: false },
  wishlist: { title: `Your wishlist — ${SITE}`, description: DEFAULT_DESC, noindex: true },
  account: { title: `Your account — ${SITE}`, description: DEFAULT_DESC, noindex: true },
  checkout: { title: `Checkout — ${SITE}`, description: DEFAULT_DESC, noindex: true },
  success: { title: `Order confirmed — ${SITE}`, description: DEFAULT_DESC, noindex: true },
  reset: { title: `Reset your password — ${SITE}`, description: DEFAULT_DESC, noindex: true },
  admin: { title: `Admin — ${SITE}`, description: DEFAULT_DESC, noindex: true },
};

export function Seo() {
  const { state, products, settings, catSlug } = useStore();
  const { page, cat, featuredId, categories } = state;
  const logo = '/assets/logo.jpg';

  let head: Head;
  const featured = featuredId ? products.find((p) => p.id === featuredId) : undefined;
  if (page === 'shop' && featured) {
    head = productHead(featured, categories.find((c) => c.id === featured.categoryId)?.id ?? catSlug);
  } else if (page === 'shop' && featuredId) {
    // The bottle is not loaded (yet, or at all): keep the site defaults.
    head = { title: `${SITE} — ${TAGLINE}`, description: DEFAULT_DESC, path: `/product/${featuredId}`, image: logo, type: 'website', noindex: false, ld: null };
  } else if (page === 'shop' && cat !== 'All') {
    const n = products.filter((p) => p.active && p.category === cat).length;
    head = {
      title: `${cat} — ${SITE}`,
      description: clip(`${cat} at ${SITE}: ${n ? `${n} bottle${n === 1 ? '' : 's'}` : 'our selection'}, each listed with its origin, strength and ingredients. ${DEFAULT_DESC}`),
      path: `/shop/${catSlug}`,
      image: logo,
      type: 'website',
      noindex: false,
      ld: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${cat} — ${SITE}`,
        url: abs(`/shop/${catSlug}`),
        isPartOf: { '@id': window.location.origin + '/#store' },
      },
    };
  } else if (page === 'shop') {
    head = { title: `${SITE} — ${TAGLINE}`, description: DEFAULT_DESC, path: '/', image: logo, type: 'website', noindex: false, ld: null };
  } else {
    const p = PLAIN[page] ?? PLAIN.admin;
    head = { ...p, path: window.location.pathname, image: logo, type: 'website', ld: null };
  }

  const site = siteLd(settings);
  const key = JSON.stringify([head, site]);

  useEffect(() => {
    const url = abs(head.path);
    const image = abs(head.image);
    document.title = head.title;
    upsertMeta('name', 'description', head.description);
    upsertMeta('name', 'robots', head.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
    upsertLink('canonical', url);
    upsertMeta('property', 'og:site_name', SITE);
    upsertMeta('property', 'og:type', head.type);
    upsertMeta('property', 'og:title', head.title);
    upsertMeta('property', 'og:description', head.description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:image:alt', head.type === 'product' ? head.title : SITE);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', head.title);
    upsertMeta('name', 'twitter:description', head.description);
    upsertMeta('name', 'twitter:image', image);
    upsertJsonLd('ld-site', site);
    upsertJsonLd('ld-page', head.ld);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}
