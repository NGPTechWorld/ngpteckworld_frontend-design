/**
 * Per-page link previews for a client-rendered site.
 *
 * WhatsApp, Facebook, X, Telegram and LinkedIn build a preview by fetching the URL and reading the
 * HTML. None of them runs JavaScript. So for this SPA every shared link — a person, a project, the
 * home page — returned the same markup and therefore the same preview, no matter what the app set
 * on `document` once it booted.
 *
 * This function serves the real index.html with the block between the `<!--og-->` markers swapped
 * for tags describing whatever the URL actually points at. The response is still the ordinary app
 * shell, so a human following the link gets the SPA exactly as before; only the head differs.
 *
 * Wired up by vercel.json, which rewrites /team/:slug and /portfolio/:slug here.
 */

const SITE = (process.env.SITE_URL || 'https://ngptechworld.com').replace(/\/+$/, '')
const API = (process.env.API_BASE_URL || 'https://api.ngptechworld.com/api').replace(/\/+$/, '')
const FALLBACK_IMAGE = `${SITE}/assets/og-cover.jpg`

/** HTML-escape everything interpolated into an attribute — titles are user-supplied content. */
const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Collapse whitespace and cut on a word boundary: previews truncate hard at ~200 characters. */
function summarise(text, max = 190) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  return cut.slice(0, cut.lastIndexOf(' ') || max).trimEnd() + '…'
}

/** Uploaded media comes back from the API with whatever scheme it was generated with. */
const https = (url) => (url ? String(url).replace(/^http:\/\//i, 'https://') : null)

function tags({ title, description, url, image, type = 'website', imageAlt }) {
  const picture = https(image) || FALLBACK_IMAGE
  // A portrait or a project shot is not 1.91:1, so width/height are declared only for the shared
  // cover — claiming the wrong dimensions makes some clients letterbox or refuse the image.
  const dimensions = picture === FALLBACK_IMAGE
    ? '<meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />'
    : ''

  return `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${esc(url)}" />

    <meta property="og:type" content="${esc(type)}" />
    <meta property="og:site_name" content="NGP TechWorld" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${esc(picture)}" />
    ${dimensions}
    <meta property="og:image:alt" content="${esc(imageAlt || title)}" />
    <meta property="og:locale" content="ar_AR" />
    <meta property="og:locale:alternate" content="en_US" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(picture)}" />
  `.trim()
}

async function fetchJson(path) {
  const res = await fetch(`${API}${path}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const body = await res.json()
  return body?.data ?? null
}

/** The Arabic field with the English one as the fallback, since the site defaults to Arabic. */
const pick = (record, key) => record?.[`${key}_ar`] || record?.[`${key}_en`] || ''

async function describeTeamMember(slug, url) {
  const member = await fetchJson(`/team/${encodeURIComponent(slug)}`)
  if (!member) return null

  const name = pick(member, 'name')
  const role = pick(member, 'job_title')
  const bio = pick(member, 'bio')

  return tags({
    // `profile` rather than `website`: it is a person, and some clients lay the card out differently.
    type: 'profile',
    title: role ? `${name} — ${role} | NGP TechWorld` : `${name} | NGP TechWorld`,
    description: summarise(bio || role || 'عضو في فريق NGP TechWorld'),
    url,
    image: member.avatar,
    imageAlt: name,
  })
}

async function describeProject(slug, url) {
  const project = await fetchJson(`/projects/${encodeURIComponent(slug)}`)
  if (!project) return null

  const name = pick(project, 'name')
  const short = pick(project, 'short')
  const description = pick(project, 'description')

  return tags({
    type: 'article',
    title: `${name} | NGP TechWorld`,
    description: summarise(short || description),
    url,
    image: project.cover_image,
    imageAlt: name,
  })
}

export default async function handler(request, response) {
  const { searchParams, origin } = new URL(request.url, `https://${request.headers.host}`)
  const type = searchParams.get('type')
  const slug = searchParams.get('slug')

  // The shell is fetched from this same deployment rather than read off disk: a serverless
  // function does not share a filesystem with the static output, and this way the hashed asset
  // names in it are always the ones this deployment actually built.
  const shell = await fetch(`${origin}/index.html`).then((r) => r.text())

  const path = type === 'team' ? `/team/${slug}` : `/portfolio/${slug}`
  const url = `${SITE}${path}`

  let replacement = null
  try {
    replacement = type === 'team'
      ? await describeTeamMember(slug, url)
      : await describeProject(slug, url)
  } catch {
    // An API hiccup must not take the page down with it — fall through to the site's own tags.
    replacement = null
  }

  const html = replacement
    ? shell.replace(/<!--og-->[\s\S]*?<!--\/og-->/, `<!--og-->\n${replacement}\n    <!--/og-->`)
    : shell

  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Cached at the edge so a popular link is not one API round trip per crawler, and served stale
  // while it refreshes so an edit to a profile shows up without anyone waiting for it.
  response.setHeader(
    'Cache-Control',
    replacement
      ? 'public, s-maxage=300, stale-while-revalidate=86400'
      : 'public, s-maxage=30, stale-while-revalidate=300',
  )
  response.status(200).send(html)
}
