# NGP Dashboard

React admin dashboard for the NGP TechWorld website. It talks to the Laravel admin API (`/api/admin/*`, Sanctum bearer
tokens) and replaces the Filament panel. Arabic-first (RTL) with an English toggle, dark purple brand look shared with the
public site.

Lives inside the public site's repo (`ngpteckworld_frontend-design/dashboard/`) as its **own** Vite project (own
`package.json`, own tests, own build) so it can be developed and deployed independently, but it is served at
**`/ngp-hq`** on the site's own domain (see [Deploy](#deploy)) — one repo, one push, one visible site to visitors.

Stack: Vite 8 · React 19 · React Router 7 · Tailwind 3 · TanStack Query · react-hook-form + zod · dnd-kit · lucide-react ·
Vitest + Testing Library.

Docs: [`docs/PLAN.md`](docs/PLAN.md) (project contract) · [`docs/UI-KIT.md`](docs/UI-KIT.md) (component kit, data layer,
feature recipes, testing).

## Setup

```bash
npm install
cp .env.example .env      # optional — the defaults work with the local backend
```

Requirements: Node 20.19+ or 22.12+ (developed on Node 24 / npm 11) and the backend running (`php artisan serve` → `http://127.0.0.1:8000`).
Sign in with an admin user of the backend (email on the `@ngptechworld.com` domain).

## Run

```bash
npm run dev        # http://localhost:5174/ngp-hq/ — /api is proxied to http://127.0.0.1:8000
npm test           # vitest run (jsdom); npm run test:watch for watch mode
npm run build      # production bundle in dist/
npm run preview    # serve dist/ on :5174
```

`vite.config.js` sets `base: '/ngp-hq/'` (production URL shape) — that's why the dev server also serves under
`/ngp-hq/`, not `/`. It is not `/admin` on purpose: that is the first path every scanner tries.

Run a subset: `npx vitest run src/features/faqs`.

Environment (`.env`, all optional):

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | API base **without** `/admin`. Relative in dev (Vite proxy); absolute in production, e.g. `https://api.example.com/api` |

The session token is stored in `localStorage` under `ngp_admin_token` (language under `ngp_admin_lang`). A 401 from the API
signs the user out and redirects to `/login`.

## Deploy

Deployed as its **own Vercel project**, Root Directory `dashboard` inside the site's repo — build command
`npm run build`, output directory `dist`, env var `VITE_API_BASE_URL` = absolute API URL (must include `/api`).
That project gets its own `*.vercel.app` URL, but visitors never see it: the **site's own** `vercel.json` (one
level up) rewrites `/ngp-hq/*` to it, so `https://<your-site-domain>/ngp-hq` is the real, public URL. Full steps
(including the one-time step of pasting the dashboard project's URL into the site's `vercel.json`) are in
[`../docs/DEPLOY.md`](../docs/DEPLOY.md) — read that before deploying, `base: '/ngp-hq/'` in `vite.config.js` and
this project's own `vercel.json` only work together with that outer rewrite in place.

* Backend: `DASHBOARD_URL` in the Laravel `.env` should normally be the **same** origin as `FRONTEND_URL` — once
  proxied, the browser's address bar (and the `Origin` header the dashboard's `fetch()` calls send) is the site's
  own domain, not the dashboard project's `*.vercel.app` URL.
* Serve over HTTPS only (bearer tokens).

## Project structure

```
src/
  app/        shell: App, AppRoutes (collects features), AuthProvider, ProtectedRoute, Login, layout (sidebar/topbar), error boundary
  features/   one folder per section: index.jsx { id, nav, routes } is auto-discovered (faqs = complete reference feature)
  ui/         component kit (import from '@/ui')
  lib/        api client, createCrudHooks, useListParams, validation helpers, formatting, storage
  i18n/       LanguageContext (ar/en, RTL/LTR), shared strings, useStrings / useCommon / useFormat
  test/       setup, renderWithProviders, mockApi
```

Alias: `@` = `src` (configured in `vite.config.js` and `jsconfig.json`).

## Adding a feature

1. Create `src/features/<area>/` with `index.jsx` exporting `{ id, nav: { order, group, icon, label: {ar, en}, to }, routes }`
   — it appears in the sidebar and the router automatically (no registration).
2. Put texts in `strings.js` (`{ ar, en }`), data hooks in `hooks.js` (`createCrudHooks('/things')`), pages next to them.
3. Copy `src/features/faqs/` (list with search / filter / sorting / pagination / inline toggle / delete / drag-reorder, and a
   create/edit form with server-side validation errors) and follow [`docs/UI-KIT.md`](docs/UI-KIT.md).
4. Write tests next to the code (`renderWithProviders` + `mockApi`) and run `npx vitest run src/features/<area>`.

Conventions: 2 spaces, no semicolons, single quotes; Tailwind logical properties (`ms-`, `pe-`, `start-`, `text-start`…) so RTL
works without extra code.
