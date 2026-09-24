import { afterEach, expect, it, vi } from 'vitest'
import handler from './sitemap.js'

function mockFetch({ projects = [], team = [], fail = false } = {}) {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (fail) throw new Error('network down')
    const href = String(url)
    if (href.includes('/projects')) return { ok: true, json: async () => ({ data: projects }) }
    if (href.includes('/team')) return { ok: true, json: async () => ({ data: team }) }
    return { ok: false }
  }))
}

function makeResponse() {
  return {
    headers: {}, body: null, statusCode: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v },
    status(c) { this.statusCode = c; return this },
    send(b) { this.body = b; return this },
  }
}

afterEach(() => vi.unstubAllGlobals())

it('lists the static pages and every project and member the API returns', async () => {
  mockFetch({ projects: [{ slug: 'food-delivery-app' }], team: [{ slug: 'sara-ahmad' }] })
  const res = makeResponse()
  await handler({}, res)

  expect(res.headers['content-type']).toContain('application/xml')
  expect(res.body).toContain('<loc>https://ngptechworld.com/</loc>')
  expect(res.body).toContain('<loc>https://ngptechworld.com/team</loc>')
  expect(res.body).toContain('<loc>https://ngptechworld.com/portfolio/food-delivery-app</loc>')
  expect(res.body).toContain('<loc>https://ngptechworld.com/team/sara-ahmad</loc>')
})

it('still serves the static pages when the API is unreachable', async () => {
  // A sitemap missing its detail pages beats a 500: the pages that matter most need no API.
  mockFetch({ fail: true })
  const res = makeResponse()
  await handler({}, res)

  expect(res.statusCode).toBe(200)
  expect(res.body).toContain('<loc>https://ngptechworld.com/services</loc>')
  expect(res.body).not.toContain('/portfolio/')
})
