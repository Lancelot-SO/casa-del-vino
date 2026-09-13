# Casa del Vino

The Casa del Vino storefront and admin, implemented from the Claude Design handoff in
`../project/Casa del Vino.dc.html` (the design canvas prototype) and the conversation in
`../chats/`. React 18 + TypeScript + Vite.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production bundle into dist/
npm run preview   # serve the built bundle
```

## What's in it

**Entry** — the brand mark floats in 3D on a wine-red glow for ~3s, then shatters into a
10×10 grid of shards and fades out. Behind every page, translucent glasses and bottles spin
in perspective while drifting across slow wine-coloured glows.

**Shop** — the cellar rail lists nine shelves with live counts; the featured bottle shows its
copy, price, strength, size, origin and full ingredient list, with the photo on a wine glow and
up to five ingredient medallions tumbling in 3D around it (hover one for its name, click the
photo for full screen). The rest of the shelf sits below: hovering a card lifts the bottle off
its shadow, turns it a full rotation, pops the cork and throws nine droplets out on a shockwave.

**Pages** — About, Contact (with a working form and a sent state), Wishlist, Account.

**Purchase flow** — add to bag → drawer with line totals → bag → delivery (three shipping
options, free over the configured threshold, 18+ confirmation) → payment (card with a live 3D
card preview, bank transfer, or pay on delivery) → confirmation with an order number. Buy now
jumps straight in.

**Accounts** — sign in, create account, or continue as guest. Checkout asks you to choose first
and pre-fills your details. Demo admin: `admin@casadelvino.com` / `admin`.

**Admin** — its own frosted frame: dashboard (orders, revenue, bottle/shelf/customer tiles,
weekly sales chart, cellar-by-shelf ring, recent orders, latest bottles), products (add / edit /
remove, multiple photos per bottle with a click-to-set cover, restore defaults), orders,
customers, and settings that drive the Contact page and the free-shipping threshold.
The bell shows unread orders, sign-ups and catalog changes.

**Responsive** — under 760px the sidebar becomes a top bar with a scrolling shelf strip, panels
tighten, cards flow two-up, the checkout summary drops below the steps and the bag goes
full-width.

## How it's built

| Path | What's there |
| --- | --- |
| `src/store/store.tsx` | All app state, the localStorage session, ingredient-photo loading, and `useLayout()` for the breakpoints |
| `src/store/selectors.ts` | Catalog filtering, the featured bottle, the rail, the bag, ingredient medallion placement |
| `src/data/catalog.ts` | The five default bottles, category and icon tables, entry/medallion config |
| `src/components/ui/` | `Btn` / `Box` / `Input` primitives that carry the design's hover and focus declarations |
| `src/components/`, `src/pages/` | The screens, mirroring the design's sections |
| `src/styles/global.css` | The design's keyframes and base styles, ported verbatim |

The design canvas prototype expressed hover and focus as extra inline style declarations
(`style-hover` / `style-focus`). `Btn`, `Box`, `Input`, `Textarea` and `Select` reproduce that
with a `hoverStyle` / `focusStyle` prop, which keeps each component a close read of its
counterpart in the design.

## Things worth knowing

- **Everything is on-device.** Accounts, catalog edits, orders and settings live in
  `localStorage` under the `cdv-*` keys — the same as the prototype. A real launch needs a
  backend for users, orders and products; Google sign-in and password reset are visual only.
- **Ingredient medallion photos are fetched at runtime** from the Wikipedia summary API (the
  thumbnail is used exactly as served — resizing it returns HTTP 400). Without network access
  each medallion falls back to a wine-red line icon, by design.
- **Prices are the placeholders from the design** (Syrah €12,50, Vermouth €9,90, J&B €21,
  Absolut €3,50, Ruavieja €3,20). Change them in `src/data/catalog.ts` or through the admin.
- **Contact details are placeholders too** — edit them in the admin's Settings tab.
- The Modernist design system is linked from `index.html` because the design reads
  `var(--font-body)` from it; the palette is the design's own wine-red on near-black.
