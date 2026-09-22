# Deployment guide

Three pieces, all live:

| Piece | Where | URL |
|---|---|---|
| **Public site** (this repo's root) | Vercel project `ngp-site` | https://ngptechworld.com |
| **Dashboard** (`dashboard/`) | Vercel project `ngp-dashboard` | https://ngptechworld.com/admin |
| **Backend** (`ngp-backend`) | Docker on `91.99.224.132` | https://api.ngptechworld.com |

The backend has its own runbook in that repo's `docs/DEPLOY.md`.

## Why one repo, two Vercel projects

The dashboard is a separate Vite app (own `package.json`, build, tests) so a dashboard bug can
never break a site deploy or vice versa — but it must **not** feel like a separate product. Vercel
lets several projects share one repository via each project's own *Root Directory*, and one
project's `vercel.json` transparently proxies `/admin` to the other project's URL. The result: one
`git push` updates both, one visible domain, `/admin` just works.

Because the dashboard is proxied rather than given its own subdomain, the browser origin for both
apps is `https://ngptechworld.com`. That is why the backend's `FRONTEND_URL` and `DASHBOARD_URL`
hold the same value.

## Shipping a change

Both projects deploy from the **`production`** branch. `master` is the integration branch;
pushing there produces preview deployments, not production ones.

```bash
git checkout production && git merge --ff-only master && git push origin production
```

`.github/workflows/ci.yml` runs the tests and a production build for both apps on every push and
PR. Vercel's own Git integration does the deploying — there are no deploy credentials in this
repo.

**Every push to `production` rebuilds and redeploys both projects**, even one that touched only
the other app. That is deliberate. The obvious optimisation — an *Ignored Build Step* of
`git diff --quiet HEAD^ HEAD -- .` on the dashboard — was tried and removed, because
`HEAD^ HEAD` only compares the final commit of a push against its parent: push three commits
where the dashboard changed in the first and not the last, and its build is skipped and the
change never ships. Both builds take seconds, so there is nothing worth buying with that risk.

## Vercel project settings

Set once; recorded here because they live in Vercel's UI rather than in this repo.

| | `ngp-site` | `ngp-dashboard` |
|---|---|---|
| Root Directory | `.` | `dashboard` |
| Framework | Vite | Vite |
| Production Branch | `production` | `production` |
| `VITE_API_BASE_URL` | `https://api.ngptechworld.com/api` | same |
| Domains | `ngptechworld.com`, `www.ngptechworld.com` | `ngp-dashboard.vercel.app` |

`vercel.json` at the repo root rewrites `/admin/:path*` to `https://ngp-dashboard.vercel.app`.
That is the dashboard's **stable alias**, not a deployment URL — a deployment URL changes on every
deploy and the rewrite would break the next time the dashboard shipped.

If the dashboard ever gets its own custom domain, update that rewrite; nothing else changes.

## DNS

Managed at Hetzner (`ns1.your-server.de`, `ns.second-ns.com`, `ns3.second-ns.de`).

| Record | Type | Value |
|---|---|---|
| `ngptechworld.com` | A | `216.150.1.1` and `216.150.16.1` |
| `www` | CNAME | `b09cb6e54c7b5550.vercel-dns-016.com.` |
| `api` | A | `91.99.224.132` |
| `api` | AAAA | `2a01:4f8:c2c:5c53::1` |

Leave the `MX` records alone — changing `A` does not affect email, but replacing the whole zone
would.

## Where the content comes from

Everything is managed from the dashboard: services, projects, stats, testimonials, partners, FAQ,
the contact details and social links (**Site settings**), and the page texts (**Page content**).
If the API is unreachable the site still renders, using the fallback text in `src/i18n/ui.js` and
`src/lib/SiteSettings.jsx`.

## After going live

* Sign in at https://ngptechworld.com/admin and **change the seeded admin password**.
* Fill **Site settings** (phone, social links) and review **Page content**.
* Upload real project images and team photos; add testimonials, partners and FAQs.
* Create one account per person under **Users** rather than sharing the first admin.

## Filament

The backend still exposes its old Filament panel at `https://api.ngptechworld.com/admin` — a
different thing from this dashboard's `/admin`, on a different domain. The React dashboard covers
every section of it. Retiring it is worth doing: Filament stores uploaded files with the extension
the browser supplied, which the new API does not. Remove its provider from
`bootstrap/providers.php` in the backend repo when you are confident in the new panel.
