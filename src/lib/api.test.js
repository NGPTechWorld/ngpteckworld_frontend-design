import { vi } from 'vitest'
import { api } from './api'

const respond = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api.getContent', () => {
  test('GETs /content and returns the unwrapped data', async () => {
    const data = { texts: { heroBadge: { ar: 'أ', en: 'a' } }, collections: { process_steps: [] } }
    const fetchMock = vi.fn().mockResolvedValue(respond(200, { data }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.getContent()).resolves.toEqual(data)

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/content$/)
    expect(options?.method ?? 'GET').toBe('GET')
  })

  test('rejects on an HTTP error so the provider can fall back', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(404, { message: 'Not Found' })))
    await expect(api.getContent()).rejects.toMatchObject({ status: 404 })
  })

  test('rejects when the server answers with something that is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected token <') },
    }))
    await expect(api.getContent()).rejects.toBeInstanceOf(SyntaxError)
  })

  test('rejects when the network is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(api.getContent()).rejects.toBeInstanceOf(TypeError)
  })
})
