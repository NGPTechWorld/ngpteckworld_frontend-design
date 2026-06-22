const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

async function req(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json', ...(options?.body ? { 'Content-Type': 'application/json' } : {}) },
    ...options,
  })
  if (!res.ok) {
    const err = new Error(`API ${res.status}`)
    err.status = res.status
    try { err.body = await res.json() } catch { /* ignore */ }
    throw err
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  getServices: async () => (await req('/services')).data,
  getProjects: async (category) =>
    (await req(`/projects${category && category !== 'all' ? `?category=${category}` : ''}`)).data,
  getProject: async (slug) => (await req(`/projects/${slug}`)).data,
  postContact: (payload) => req('/contact', { method: 'POST', body: JSON.stringify(payload) }),
}
