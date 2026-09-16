# Casa del Vino

The Casa del Vino storefront and admin, implemented from the Claude Design handoff in
`../project/Casa del Vino.dc.html` and the conversation in `../chats/`, and backed by
Supabase. React 18 + TypeScript + Vite + React Router + supabase-js.

```bash
cp .env.example .env.local   # then fill in the Supabase URL and anon key
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production bundle into dist/
npm run preview   # serve the built bundle
```

**First run:** apply the files in `../supabase/migrations/` to the Supabase project, in
order, by pasting each into the Supabase SQL editor. Until then the shop shows "We could not reach the cellar".
`0003_notifications_and_account_status.sql` adds the clearable bell and customer account
status; without it "Clear all", dismissing a notification and deactivating an account fail.

## What's in it

**Entry** — an 18+ age gate, then the brand mark floats in 3D on a wine-red glow, shatters
into a 10×10 grid of shards and fades out. Behind every page, translucent glasses and bottles
spin in perspective while drifting across slow wine-coloured glows.

**Shop** — the search looks through the whole cellar (name, shelf, country, origin,
description and ingredients) and shows every match; the cellar rail lists the shelves with live counts; the featured bottle shows its
copy, price, strength, size, origin, stock and full ingredient list, with the photo on a wine
glow and up to five ingredient medallions tumbling in 3D around it. Sold-out bottles say so.
Every shelf and bottle has a URL (`/shop/red-wine`, `/product/syrah`).

**Pages** — About, Contact (messages land in the admin inbox), Wishlist, Account (delivery
details and order history), Legal.

**Purchase flow** — add to bag → drawer → bag → delivery (three options, free standard shipping
over the configured threshold, 18+ confirmation) → payment (MTN MoMo / Telecel Cash to the shop's number with the product name as
reference, a phone call to arrange it, or card through Stripe Checkout when enabled) → confirmation with an order number. Orders are
created by the `place_order` database function, which recomputes totals and checks stock.

**Accounts** — Supabase Auth: email and password, Google (when the provider is configured),
password reset by email, or continue as guest. A guest's bag and wishlist merge into the
account on sign-in.

**Admin** — its own frosted frame: dashboard (real weekly sales, revenue paid vs ordered,
low-stock warnings, cellar-by-shelf ring, visits, recent orders, latest bottles), products (add / edit /
remove, stock, visibility, multiple photos uploaded to Cloudinary, ingredient medallion photos
cached there automatically), orders (filter, expand, set status and payment; cancelling restocks),
customers (deactivate / restore — an account is never deleted, it is marked inactive and can
no longer sign in or order), messages, and settings (contact details, delivery prices,
free-shipping threshold). The bell shows unread orders, sign-ups, messages and catalog
changes; items can be dismissed one by one or cleared all at once, and that is remembered.

## How it's built

| Path | What's there |
| --- | --- |
| `src/lib/supabase.ts` | The client, built from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` |
| `src/lib/api.ts` | Every read and write: catalog, storage uploads, orders, cart, wishlist, profiles, messages |
| `src/store/store.tsx` | App state, auth session, cart/wishlist sync, checkout, `routes` builders, `useLayout()` |
| `src/store/selectors.ts` | Filtering, the featured bottle, the rail, the bag, medallion placement |
| `src/App.tsx` | The routes; the admin route is guarded by role (and by row-level security server-side) |
| `src/data/catalog.ts` | Icon paths, shipping/payment labels, the entry-animation config |
| `src/components/ui/` | `Btn` / `Box` / `Input` primitives carrying the design's hover and focus declarations |
| `src/components/`, `src/pages/` | The screens, mirroring the design's sections |
| `src/styles/global.css` | The design's keyframes and base styles |
| `../supabase/migrations/` | Schema, policies, `place_order`, storage bucket, the shelves and settings row |
| `../supabase/functions/` | `create-checkout-session` and `stripe-webhook` edge functions |

The design canvas prototype expressed hover and focus as extra inline style declarations.
`Btn`, `Box`, `Input`, `Textarea` and `Select` reproduce that with a `hoverStyle` /
`focusStyle` prop.

## Things worth knowing

- **Only a guest's bag, wishlist, guest flag and age-gate answer stay in localStorage.**
  Everything else is in Supabase.
- **Ingredient medallion photos** come from a cached URL in `product_ingredients.image_url`
  when the admin has saved the bottle, and from the Wikipedia summary API at runtime otherwise
  (the thumbnail is used exactly as served — resizing it returns HTTP 400). Without either, a
  wine-red line icon is drawn.
- **Photos live on Cloudinary, not in the database.** The admin uploads straight to an unsigned
  upload preset and only the URL is saved. Every render goes through `cdn()` in
  `src/lib/cloudinary.ts`, which asks for the display width in AVIF/WebP. Until the two
  `VITE_CLOUDINARY_*` variables are set, uploads fall back to Supabase Storage.
- **Card payments** are off until the Stripe functions are deployed and `VITE_CARD_PAYMENTS=on`.
- **Prices** are Ghana cedis (GH₵), stored as pesewas.
- **Mobile money** details (number and account name) are set in Admin → Settings; until then
  checkout tells customers to call the shop. Mark the order paid in Admin → Orders once the money lands.
- **Email** is sent from Postgres via Resend as `Casa del Vino <info@casadelvino.shop>` (the
  GoDaddy mailbox; the domain is verified in Resend). Customers get an order confirmation;
  the shop address gets a "new order" alert and every Contact-page message, with Reply-To set
  to the customer so answering is one click. Admin mail goes to the address in Admin →
  Settings (only if that is empty, to every admin account). `0005_order_emails.sql` sets it
  up and `0008_contact_emails.sql` adds the contact emails and the address; the Resend API
  key lives in the Supabase Vault as `resend_api_key`.
- **Cash sales** at the counter: press "Cash" beside the bottle in Admin → Products, enter how
  many were sold and the day the cash was taken (defaults to today), and confirm. The stock
  drops by that many and a paid, delivered order tagged CASH is recorded at the bottle's
  current price, dated that day, so it counts in revenue and the weekly chart and shows in
  Admin → Orders (there is a "cash" filter). No emails are sent for it. Cancelling the order
  puts the bottles back. Needs `0006_cash_sales.sql` (the `cash` pay method and the
  `record_cash_sale` function).
- **Visits** (Admin → Dashboard → Visits): every storefront page a visitor opens writes one
  row to `page_views` (`src/lib/visits.ts`), with a random visitor id kept in the browser, a
  random id per tab session, the path, the site the session arrived from (or a `utm_source`)
  and phone/desktop. No IP address, name or account id. Crawlers and link-preview bots are
  skipped, and so is the admin's own browsing. The card shows visitors and views for today,
  7 days and the chosen range (7 / 30 / 90 days), a per-day chart, the most visited pages and
  where sessions came from ("Direct, typed or WhatsApp" covers anything that hides its
  referrer). Needs `0007_visits.sql` (the table, its policies and `visit_stats()`). Set
  `VITE_GA_ID` to a Google Analytics 4 measurement id to send the same page views there too.
- **SEO**: `src/components/Seo.tsx` keeps the document head in step with the route — title,
  description, canonical link, Open Graph / Twitter cards, `noindex` on account, checkout,
  wishlist, reset and admin pages, and JSON-LD (`LiquorStore` with the contact details from
  Admin → Settings on every page; `Product` + breadcrumbs on a bottle; `CollectionPage` on a
  shelf). `vite-seo.ts` fills `__SITE_URL__` in `index.html` from `VITE_SITE_URL` (so the
  share image and canonical are absolute), writes `robots.txt`, and writes `sitemap.xml` with
  every page, shelf and active bottle read from Supabase at build time — redeploy after adding
  bottles to refresh it. Both files are served by `npm run dev` as well. Without
  `VITE_SITE_URL` the build warns and writes no sitemap. WhatsApp and Facebook do not run
  JavaScript, so a shared bottle link previews with the site logo and tagline from
  `index.html`, not the bottle's own photo; Google does render the app and sees the per-bottle
  tags.
- The Modernist design system is linked from `index.html` because the design reads
  `var(--font-body)` from it; the palette is the design's own wine-red on near-black.
