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
