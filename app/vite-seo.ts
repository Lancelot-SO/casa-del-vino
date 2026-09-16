import type { Plugin } from 'vite';

/**
 * Search-engine plumbing that has to exist as real files next to index.html:
 *
 *  - replaces `__SITE_URL__` in index.html with VITE_SITE_URL, so the
 *    canonical link and the Open Graph image are absolute (WhatsApp, Facebook
 *    and Google need that; they do not run the app to find out);
 *  - writes robots.txt (private pages kept out of the index);
 *  - writes sitemap.xml with every page, shelf and bottle, read from Supabase
 *    at build time. Redeploy after adding bottles to refresh it; Google also
 *    finds new bottles through the shop's own links in the meantime.
 *
 * Both files are served in `vite dev` too.
 */

interface Options {
  /** Public origin, e.g. https://casadelvino.com. Empty = unknown (relative URLs, no sitemap). */
  siteUrl: string;
  supabaseUrl?: string;
  anonKey?: string;
}

const STATIC_PATHS = ['/', '/about', '/contact', '/legal'];
const PRIVATE_PATHS = ['/admin', '/account', '/checkout', '/wishlist', '/reset-password'];

const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] as string);

async function rest<T>(base: string, key: string, query: string): Promise<T[]> {
  const res = await fetch(`${base.replace(/\/$/, '')}/rest/v1/${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${query}`);
  return (await res.json()) as T[];
}

export function seo(o: Options): Plugin {
  const site = o.siteUrl.trim().replace(/\/$/, '');
  const robots =
    ['User-agent: *', 'Allow: /', ...PRIVATE_PATHS.map((p) => `Disallow: ${p}`), site ? `Sitemap: ${site}/sitemap.xml` : '']
      .filter(Boolean)
      .join('\n') + '\n';

  async function sitemap(warn: (msg: string) => void): Promise<string> {
    const today = new Date().toISOString().slice(0, 10);
    const urls: { loc: string; lastmod: string; priority: string }[] = STATIC_PATHS.map((p) => ({
      loc: site + p,
      lastmod: today,
      priority: p === '/' ? '1.0' : '0.5',
    }));
    if (o.supabaseUrl && o.anonKey) {
      try {
        const products = await rest<{ id: string; category_id: string; updated_at: string }>(
          o.supabaseUrl,
          o.anonKey,
          'products?select=id,category_id,updated_at&active=eq.true&order=created_at.desc',
        );
        const categories = await rest<{ id: string }>(o.supabaseUrl, o.anonKey, 'categories?select=id&order=sort.asc');
        const stocked = new Set(products.map((p) => p.category_id));
        for (const c of categories) if (stocked.has(c.id)) urls.push({ loc: `${site}/shop/${c.id}`, lastmod: today, priority: '0.8' });
        for (const p of products) urls.push({ loc: `${site}/product/${p.id}`, lastmod: (p.updated_at || today).slice(0, 10), priority: '0.7' });
      } catch (e) {
        warn(`sitemap.xml lists only the static pages: could not read the catalog (${(e as Error).message})`);
      }
    } else {
      warn('sitemap.xml lists only the static pages: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set');
    }
    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map((u) => `  <url><loc>${esc(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n') +
      '\n</urlset>\n'
    );
  }

  return {
    name: 'cdv-seo',

    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', site);
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || '').split('?')[0];
        if (path === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(robots);
        } else if (path === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.end(await sitemap((m) => server.config.logger.warn(`[seo] ${m}`)));
        } else next();
      });
    },

    async generateBundle() {
      if (!site) {
        this.warn('VITE_SITE_URL is not set: canonical links and the share image are relative, and no sitemap.xml is written. Set it to the public address of the shop, e.g. https://casadelvino.com');
      }
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
      if (site) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: await sitemap((m) => this.warn(m)) });
    },
  };
}
