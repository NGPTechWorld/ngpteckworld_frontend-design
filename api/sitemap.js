/**
 * The sitemap, built from what the dashboard actually holds.
 *
 * It used to be a static file listing six project slugs typed out by hand. That list was already
 * wrong — it named projects that no longer exist and none of the team pages — and it would go
 * wrong again after any edit, because nothing connects a file in `public/` to the content.
 *
 * Wired up by vercel.json, which rewrites /sitemap.xml here.
 */

const SITE = (process.env.SITE_URL || 'https://www.ngptechworld.com').replace(/\/+$/, '')
const API = (process.env.API_BASE_URL || 'https://api.ngptechworld.com/api').replace(/\/+$/, '')

const STATIC_PAGES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/services', changefreq: 'monthly', priority: '0.8' },
  { path: '/portfolio', changefreq: 'weekly', priority: '0.8' },
  { path: '/team', changefreq: 'monthly', priority: '0.7' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
]

const esc = (value) =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function slugs(path) {
  try {
    const res = await fetch(`${API}${path}`, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []
    const body = await res.json()
    return (body?.data ?? []).map((row) => row.slug).filter(Boolean)
  } catch {
    // A sitemap missing its detail pages is worth far more than a 500 — the static pages, which
    // are the ones that matter most, are known without asking the API at all.
    return []
  }
}

function entry({ path, changefreq, priority, lastmod }) {
  return [
    '  <url>',
    `    <loc>${esc(SITE + path)}</loc>`,
    lastmod ? `    <lastmod>${esc(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ].filter(Boolean).join('\n')
}

export default async function handler(request, response) {
  const [projects, team] = await Promise.all([
    slugs('/projects'),
    slugs('/team'),
  ])

  const today = new Date().toISOString().slice(0, 10)

  const urls = [
    ...STATIC_PAGES.map((page) => entry({ ...page, lastmod: today })),
    ...projects.map((slug) => entry({ path: `/portfolio/${slug}`, changefreq: 'monthly', priority: '0.6' })),
    // Only active members are returned by /team, so nobody hidden in the dashboard is listed here.
    ...team.map((slug) => entry({ path: `/team/${slug}`, changefreq: 'monthly', priority: '0.5' })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`

  response.setHeader('Content-Type', 'application/xml; charset=utf-8')
  response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  response.status(200).send(xml)
}
