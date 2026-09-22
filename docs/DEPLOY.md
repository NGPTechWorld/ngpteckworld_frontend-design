# Deployment guide

Three pieces: **backend** (Laravel, serv00), **public site** (this repo, Vercel), **dashboard**
(`dashboard/` — its own Vite project inside this repo, its own Vercel project, proxied to `/admin`
on the site's own domain). Deploy in this order: backend → dashboard → site (the site's rewrite
needs the dashboard's URL, so the dashboard must exist first).

## Why one repo, two Vercel projects

The dashboard is a separate Vite app (own `package.json`, build, tests) so a dashboard bug can
never break a site deploy or vice versa — but it must **not** feel like a separate product. Vercel
lets several projects share one repository via each project's own *Root Directory*, and one
project's `vercel.json` can transparently proxy paths to another project's URL. The result: one
`git push` updates both (if both changed), one visible domain, `/admin` just works.

## 0. Before anything else

* **Rotate the serv00 database password.** An earlier `.env.example` in the backend repo
  contained it; it is still in that repo's git history even though the file is clean now. Change
  it in the serv00 panel and update the server's own `.env`.
* Nothing is committed yet anywhere. Review with `git status` / `git diff` in `ngp-backend` and
  in this repo (which now also contains `dashboard/`), then commit.

## 1. Backend on serv00

1. Upload/pull the code, then `composer install --no-dev --optimize-autoloader`
   (openspout in `composer.lock` supports PHP ≤ 8.4 only; it is unused — add
   `--ignore-platform-req=php` if the host runs 8.5).
2. Server `.env` (never commit it):
   ```
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://<backend-domain>
   DB_*=<serv00 credentials>
   FRONTEND_URL=https://<your-site-domain>
   DASHBOARD_URL=https://<your-site-domain>       # same origin as the site — see step 3
   CORS_ALLOWED_ORIGINS_PATTERNS=                 # empty: do not trust every *.vercel.app
   SANCTUM_EXPIRATION=10080                       # 7-day dashboard sessions (default is 30 days)
   CONTACT_MAIL_ENABLED=true + MAIL_* (SMTP)      # only if you want an email per contact request
   ```
3. First deploy only: add `ADMIN_PASSWORD=<strong password>` (≥ 8 chars) to `.env`, run
   `php artisan migrate --force` then `php artisan db:seed --force`, then **remove**
   `ADMIN_PASSWORD` from `.env`. Later deploys: `php artisan migrate --force` only (never the full
   `db:seed` again; use `--class=`). Migrations create `site_settings`, `admin_notes` on
   `contacts`, `site_contents` and `content_items` with their defaults — no manual seeding needed
   for them.
4. `php artisan config:clear && php artisan route:clear && php artisan view:clear`.
5. Docroot = the app's `public/` folder. Create the media link:
   `cd public && ln -s ../storage/app/public media`.
6. Cron (every minute): `php /path/to/artisan schedule:run` — prunes expired API tokens daily.
7. PHP settings: `fileinfo` enabled, `upload_max_filesize=6M`, `post_max_size=8M`,
   `display_errors=Off`, `expose_php=Off`.
8. Verify: `curl https://<backend>/api/admin/nope` → JSON `{"message":"Not found."}`, no stack
   trace. `curl -I https://<backend>/media/x.php` → 403. `curl https://<backend>/api/content` →
   JSON. If the host sits behind a proxy, confirm `$request->ip()` is the visitor's real IP
   (otherwise all visitors share the login rate limiter) — configure trusted proxies in
   `bootstrap/app.php` if not.

## 2. Dashboard — new Vercel project, Root Directory `dashboard`

1. In Vercel, **Add New Project**, import this same GitHub repository again (a repo can back
   several projects) and set **Root Directory** to `dashboard`.
2. Framework preset **Vite**, build `npm run build`, output `dist`.
3. Env var: `VITE_API_BASE_URL = https://<backend-domain>/api`.
4. Deploy it and note its URL, e.g. `ngp-dashboard-xyz.vercel.app`.
5. Open it directly (that raw URL) once — `https://ngp-dashboard-xyz.vercel.app/admin/login` should
   load the sign-in page. That confirms `base: '/admin/'` + its own `vercel.json` are wired
   correctly, independent of the site's proxy (step 3).

## 3. Public site (this repo's root) on Vercel

1. Root Directory: repo root (unchanged from before). Env vars unchanged.
2. Edit **this repo's** `vercel.json` (repo root, not `dashboard/vercel.json`): replace
   `REPLACE-WITH-DASHBOARD-VERCEL-DOMAIN` in both places with the exact host from step 2.4
   (no `https://` twice, no trailing slash) — e.g.
   `"destination": "https://ngp-dashboard-xyz.vercel.app/admin/:path*"`.
3. Commit and push (or redeploy). Once live, `https://<your-site-domain>/admin` shows the
   dashboard's login page — check the browser address bar still reads your site's own domain.
4. If you later attach a custom domain to the dashboard project too, you can update the rewrite
   to point at that domain instead; nothing else changes.

## 4. Filament panel (`/admin` on the *backend*, unrelated to the dashboard's own `/admin` path)

The React dashboard covers every section of the old panel. Retire Filament once you are happy
with the new one: remove its provider from `bootstrap/providers.php` (or restrict it by IP).
Reason: Filament stores uploaded files with the extension the browser sent, which the new API
does not (the backend's `.htaccess` rule only mitigates it on Apache).

## 5. After going live

* Sign in at `https://<your-site-domain>/admin`, fill **Site settings** (phone + social links)
  and review **Page content**.
* Upload real project images/team photos; add testimonials, partners and FAQs.
* Change the admin password regularly; create one account per person under **Users**.
