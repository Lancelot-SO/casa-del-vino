# Casa del Vino — download

Everything from the session, ready to run locally.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer (this was built on Node 22).

```bash
cd app
npm install      # first time only — pulls React, Vite and TypeScript
npm run dev
```

Then open the URL it prints (usually <http://localhost:5173>).

Other commands:

```bash
npm run build     # type-check + production bundle into app/dist
npm run preview   # serve that production bundle
```

To deploy, run `npm run build` and upload `app/dist` to any static host —
Netlify, Vercel, GitHub Pages, S3. There is no server to run.

## What's in the folder

| Path | What it is |
| --- | --- |
| `app/` | **The site.** React 18 + TypeScript + Vite — this is the deliverable |
| `app/README.md` | Fuller notes: every feature, how the code is laid out, known limits |
| `project/` | The original Claude Design prototype (`Casa del Vino.dc.html`) and its assets, kept for reference |
| `chats/` | The design conversation that produced it |
| `README.md` | The handoff note that came with the design bundle |

`node_modules/` and `app/dist/` were left out — `npm install` and `npm run build`
regenerate them.

## Git history

The folder is a git repository with the work committed on the branch
`implement-casa-del-vino`. Nothing was pushed anywhere, because the session had no
remote configured. To put it on GitHub:

```bash
cd casa-del-vino
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin implement-casa-del-vino
```

## Signing in

The shop runs entirely in the browser — accounts, catalog edits, orders and settings
are saved to `localStorage`, so they persist per browser and are wiped by clearing
site data.

- **Admin:** `admin@casadelvino.com` / `admin` — the sign-in card has a one-click
  shortcut for it. Signing in as admin adds an **Admin** link to the sidebar.
- **Customer:** create any account, or use **Continue as guest**.

## Two things to know before you show it to anyone

- **Prices are placeholders** from the design (Syrah €12,50, Vermouth €9,90, J&B €21,
  Absolut €3,50, Ruavieja €3,20). Change them in the admin's Products tab, or in
  `app/src/data/catalog.ts`.
- **Contact details are placeholders** too (`hello@casadelvino.com`, a dummy Madrid
  address). Edit them in the admin's Settings tab.

Going live for real would need a backend for accounts, orders and products — right now
Google sign-in and password reset are visual only, and nothing leaves the browser.
