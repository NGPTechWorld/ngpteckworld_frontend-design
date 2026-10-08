import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './share.js'

/**
 * These previews are only ever seen by crawlers, so nothing in the app breaks when this function
 * breaks — the page still loads, the link just looks like every other link. That is exactly why
 * it is worth testing.
 */

const SHELL = `<!doctype html>
<html><head>
<!--og-->
<title>NGP TechWorld — نبني مستقبلك الرقمي</title>
<meta property="og:image" content="https://www.ngptechworld.com/assets/og-cover.jpg" />
<!--/og-->
<script type="module" src="/assets/index-abc123.js"></script>
</head><body><div id="app"></div></body></html>`

const MEMBER = {
  slug: 'sara-ahmad',
  name_ar: 'سارة أحمد', name_en: 'Sara Ahmad',
  job_title_ar: 'مهندسة برمجيات', job_title_en: 'Software Engineer',
  bio_ar: 'تبني تطبيقات موبايل منذ ست سنوات.', bio_en: 'Builds mobile apps.',
  avatar: 'http://api.ngptechworld.com/media/team-profiles/sara.jpg',
}

const PROJECT = {
  slug: 'food-delivery-app',
  name_ar: 'تطبيق توصيل طلبات', name_en: 'Food Delivery App',
  short_ar: 'تطبيق توصيل مع تتبّع لحظي للطلبات.', short_en: 'Delivery with live tracking.',
  cover_image: 'https://api.ngptechworld.com/media/projects/food.jpg',
}

/** Stand in for both the shell fetch and the API call. */
function mockFetch({ member = null, project = null, content = null } = {}) {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const href = String(url)
    if (href.endsWith('/index.html')) return { ok: true, text: async () => SHELL }
    if (href.includes('/team/')) {
      return member ? { ok: true, json: async () => ({ data: member }) } : { ok: false }
    }
    if (href.includes('/projects/')) {
      return project ? { ok: true, json: async () => ({ data: project }) } : { ok: false }
    }
    if (href.endsWith('/content')) {
      return content ? { ok: true, json: async () => ({ data: content }) } : { ok: false }
    }
    return { ok: false }
  }))
}

/** Minimal stand-in for Vercel's response object. */
function makeResponse() {
  const res = {
    headers: {},
    body: null,
    statusCode: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v },
    status(code) { this.statusCode = code; return this },
    send(body) { this.body = body; return this },
  }
  return res
}

const request = (query) => ({ url: `/api/share?${query}`, headers: { host: 'www.ngptechworld.com' } })

afterEach(() => vi.unstubAllGlobals())

describe('share previews', () => {
  it('describes a team member with their own name, role, bio and photo', async () => {
    mockFetch({ member: MEMBER })
    const res = makeResponse()
    await handler(request('type=team&slug=sara-ahmad'), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('<title>سارة أحمد — مهندسة برمجيات | NGP TechWorld</title>')
    expect(res.body).toContain('content="تبني تطبيقات موبايل منذ ست سنوات."')
    expect(res.body).toContain('property="og:url" content="https://www.ngptechworld.com/team/sara-ahmad"')
    expect(res.body).toContain('property="og:type" content="profile"')
    // Upgraded: an http image on an https page is blocked as mixed content by several clients.
    expect(res.body).toContain('content="https://api.ngptechworld.com/media/team-profiles/sara.jpg"')
    expect(res.body).not.toContain('content="http://api.ngptechworld.com')
    // The shell's own script tag has to survive, or the page would preview but never boot.
    expect(res.body).toContain('/assets/index-abc123.js')
  })

  it('describes a project', async () => {
    mockFetch({ project: PROJECT })
    const res = makeResponse()
    await handler(request('type=project&slug=food-delivery-app'), res)

    expect(res.body).toContain('<title>تطبيق توصيل طلبات | NGP TechWorld</title>')
    expect(res.body).toContain('content="تطبيق توصيل مع تتبّع لحظي للطلبات."')
    expect(res.body).toContain('content="https://api.ngptechworld.com/media/projects/food.jpg"')
  })

  it('declares image dimensions only for the shared cover, never for an upload', async () => {
    mockFetch({ member: MEMBER })
    const res = makeResponse()
    await handler(request('type=team&slug=sara-ahmad'), res)
    // A portrait is not 1.91:1; claiming it is makes clients letterbox or drop it.
    expect(res.body).not.toContain('og:image:width')

    mockFetch({ member: { ...MEMBER, avatar: null } })
    const bare = makeResponse()
    await handler(request('type=team&slug=sara-ahmad'), bare)
    expect(bare.body).toContain('og:image:width" content="1200"')
    expect(bare.body).toContain('/assets/og-cover.jpg')
  })

  it('falls back to the site-wide tags when the record is gone', async () => {
    mockFetch({})
    const res = makeResponse()
    await handler(request('type=team&slug=deleted'), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('NGP TechWorld — نبني مستقبلك الرقمي')
    expect(res.body).toContain('/assets/og-cover.jpg')
  })

  it('still serves the page when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).endsWith('/index.html')) return { ok: true, text: async () => SHELL }
      throw new Error('network down')
    }))
    const res = makeResponse()
    await handler(request('type=project&slug=anything'), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('<div id="app">')
  })

  it('escapes content so a quote in a title cannot break out of the attribute', async () => {
    mockFetch({ project: { ...PROJECT, name_ar: 'مشروع "خاص" <script>', short_ar: 'وصف & رموز' } })
    const res = makeResponse()
    await handler(request('type=project&slug=x'), res)

    expect(res.body).toContain('&quot;خاص&quot;')
    expect(res.body).toContain('&lt;script&gt;')
    expect(res.body).toContain('وصف &amp; رموز')
  })
})

describe('the fixed pages', () => {
  it('gives each one its own title, description and canonical', async () => {
    // They were all served the same index.html, so Google saw six identical documents and left
    // them in "discovered, not indexed" without ever crawling them.
    mockFetch({})
    const res = makeResponse()
    await handler(request('type=page&slug=about'), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('<title>من نحن | NGP TechWorld</title>')
    expect(res.body).toContain('rel="canonical" href="https://www.ngptechworld.com/about"')
    expect(res.body).toContain('property="og:url" content="https://www.ngptechworld.com/about"')
  })

  it('prefers the heading the dashboard actually publishes', async () => {
    mockFetch({ content: { texts: { contactTitle: { ar: 'لنبدأ الحديث', en: "Let's talk" }, contactSub: { ar: 'نعود إليك خلال 24 ساعة.', en: '' } } } })
    const res = makeResponse()
    await handler(request('type=page&slug=contact'), res)

    expect(res.body).toContain('<title>لنبدأ الحديث | NGP TechWorld</title>')
    expect(res.body).toContain('content="نعود إليك خلال 24 ساعة."')
  })

  it('falls back to its own wording when the dashboard has none', async () => {
    mockFetch({ content: { texts: { contactTitle: { ar: '   ', en: '' } } } })
    const res = makeResponse()
    await handler(request('type=page&slug=contact'), res)

    // Blank is not a title; a page with none is the problem this exists to fix.
    expect(res.body).toContain('<title>تواصل معنا | NGP TechWorld</title>')
  })

  it('still answers when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).endsWith('/index.html')) return { ok: true, text: async () => SHELL }
      throw new Error('network down')
    }))
    const res = makeResponse()
    await handler(request('type=page&slug=services'), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('<title>خدماتنا | NGP TechWorld</title>')
  })

  it('leaves the shell alone for a page it does not know', async () => {
    mockFetch({})
    const res = makeResponse()
    await handler(request('type=page&slug=nowhere'), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('NGP TechWorld — نبني مستقبلك الرقمي')
  })

  it('keeps the app booting — the page is still the SPA', async () => {
    mockFetch({})
    const res = makeResponse()
    await handler(request('type=page&slug=team'), res)

    expect(res.body).toContain('/assets/index-abc123.js')
    expect(res.body).toContain('<div id="app">')
  })
})
