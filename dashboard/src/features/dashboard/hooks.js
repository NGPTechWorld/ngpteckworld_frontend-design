import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

/** Shared by the home page and the requests inbox (status tab counts); requests mutations invalidate it. */
export const DASHBOARD_KEY = ['dashboard']

/** GET /dashboard → `{ counts, recent_requests, requests_last_30_days }` (the envelope is already unwrapped). */
export function useDashboard(options = {}) {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: ({ signal }) => api.get('/dashboard', undefined, { signal }).then((res) => res.data),
    ...options,
  })
}
