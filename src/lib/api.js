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
  getStats: async () => (await req('/stats')).data,
  getServices: async () => (await req('/services')).data,
  getProjects: async (category) =>
    (await req(`/projects${category && category !== 'all' ? `?category=${category}` : ''}`)).data,
  getProject: async (slug) => (await req(`/projects/${slug}`)).data,
  getTestimonials: async () => (await req('/testimonials')).data,
  getPartners: async () => (await req('/partners')).data,
  getFaqs: async () => (await req('/faqs')).data,
  getTeam: async () => (await req('/team')).data,
  getTeamMember: async (slug) => (await req(`/team/${slug}`)).data,
  getSettings: async () => (await req('/settings')).data,
  getContent: async () => (await req('/content')).data,
  postContact: (payload) => req('/contact', { method: 'POST', body: JSON.stringify(payload) }),
  // Records this visit and answers with the new total, in one request. A POST because it
  // writes; the server deduplicates, so calling it on every page load is not a problem.
  recordVisit: async () => (await req('/visits', { method: 'POST' })).data,
}
