# NGP TechWorld — Frontend

Bilingual (Arabic RTL / English LTR) marketing website for NGP TechWorld.
**Vite + React 19 + React Router + Tailwind CSS**, a static SPA that consumes the
[NGP TechWorld backend](https://github.com/NGPTechWorld/ngp-backend) API.

## Setup

```bash
npm install
cp .env.example .env      # VITE_API_BASE_URL=/api
npm run dev               # http://localhost:5173
```

The dev server proxies `/api` → `http://127.0.0.1:8000` (see `vite.config.js`), so run
the backend alongside it to get live data. Without the backend, pages still render and
data-driven sections show fallback content from `src/i18n/ui.js`.

```bash
npm run build            # production build → dist/
npm test                 # unit tests (Vitest)
```

## Where the content comes from

Everything is managed from the backend dashboard: services, projects (the *Featured* switch
decides which three show on Home), stats, testimonials, partners, FAQ — and the contact
email/phone and social links (**Site settings**, served by `/api/settings`; an empty social link
hides its button) — plus the page texts described in [Page content](#page-content).
Stats, testimonials, partners and FAQ show fallback content from `src/i18n/ui.js` if the API
is unreachable; contact details fall back to the defaults in `src/lib/SiteSettings.jsx`.

A project's video field accepts a normal YouTube or Vimeo link (converted to an embed player
by `src/lib/video.js`); any other link is shown as a "Watch video" button.

## Page content

The texts that used to be hard-coded — hero and intro, section headings, page titles and
sub-headings, the About page (story, vision, mission, values, "why choose us"), the "How we work"
steps, the call to action and the footer — are edited from the dashboard's **Page content**
screen and served by `GET /api/content`.

- `src/lib/SiteContent.jsx`: `ContentProvider` fetches `/api/content` once (it wraps
  `LanguageProvider` in `src/main.jsx`); `useContent()` returns the raw `{ texts, collections }`
  payload, or `null` when nothing was loaded.
- `src/lib/mergeContent.js`: `LanguageProvider` overlays that payload on `src/i18n/ui.js` for the
  current language, so components keep reading `t.*` and switching language switches the merged
  text. A text key with a non-empty value in the current language replaces the built-in text.
  The `process_steps`, `values` and `why_us` collections replace `t.processSteps`, `t.values`
  and `t.whyus` when they hold at least one item.
- **Fallback:** `ui.js` remains the default. If the request fails, the endpoint is not deployed
  yet, or a text or list is empty (or empty in one language only), the built-in text is used, so
  the site looks exactly as it did before. Unknown keys and malformed values are ignored. The
  built-in text is shown until the request finishes.

## Deployment (Vercel)

- **Root Directory:** repo root (`.`)
- **Env var:** `VITE_API_BASE_URL = https://<backend-domain>/api`
- SPA deep-link routing is handled by `vercel.json` (rewrites to `index.html`).
- Pushing to `master` auto-redeploys.

## Structure

```
src/
├── pages/         # Home, Services, Portfolio, ProjectDetail, About, Contact, NotFound
├── components/    # Navbar, Footer, cards, sections (Process, Testimonials, Partners, FAQ)…
├── i18n/          # LanguageContext + bilingual ui.js dictionary
├── lib/           # api.js (backend client) + visuals.js
└── styles/        # tokens.css (brand theme)
public/            # logos, favicon, promo embed, robots.txt, sitemap.xml
```
