// Shared fixtures of the dashboard tests.
const pad = (n) => String(n).padStart(2, '0')

/** 30 days ending 2026-09-21, oldest first; `counts[i]` is the count of day i (default: a small pattern). */
export function makeDays(counts) {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2026, 7, 23 + i)
    return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, count: counts ? (counts[i] ?? 0) : i % 7 === 0 ? 0 : i % 5 }
  })
}

export const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString()

export const counts = {
  services: 7,
  projects: 12,
  testimonials: 5,
  partners: 9,
  faqs: 6,
  requests_total: 48,
  requests_new: 4,
  requests_in_progress: 3,
  requests_done: 41,
}

export const makeRequest = (id, over = {}) => ({
  id,
  name: `Client ${id}`,
  email: `client${id}@example.com`,
  phone: '+963 933 000 111',
  message: `Message number ${id} about a new project.`,
  status: 'new',
  admin_notes: null,
  created_at: minutesAgo(id * 10),
  updated_at: minutesAgo(id * 10),
  ...over,
})

export function makeDashboard(over = {}) {
  return {
    data: {
      counts,
      recent_requests: [
        makeRequest(5, { name: 'Sara Ahmad', message: 'I would like a quote for a mobile app.', created_at: minutesAgo(5) }),
        makeRequest(4, { name: 'Omar Khaled', status: 'in_progress', created_at: minutesAgo(180) }),
        makeRequest(3, { name: 'Layla Hassan', status: 'done', created_at: minutesAgo(60 * 30) }),
      ],
      requests_last_30_days: makeDays(),
      ...over,
    },
  }
}
