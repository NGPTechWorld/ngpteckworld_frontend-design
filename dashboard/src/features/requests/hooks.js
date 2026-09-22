import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DASHBOARD_KEY } from '@/features/dashboard/hooks'
import { useCommon } from '@/i18n'
import { api, saveBlob } from '@/lib/api'
import { createCrudHooks } from '@/lib/crud'
import { errorText } from '@/lib/errors'
import { useToast } from '@/ui'

export const requests = createCrudHooks('/requests')

/** The dashboard numbers (home cards, inbox tab badges) change with every status change and deletion. */
function useRefreshCounts() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
}

/** requests.useUpdate + refresh of the dashboard counters. `mutate({ id, data: { status?, admin_notes? } })` */
export function useUpdateRequest(options = {}) {
  const refresh = useRefreshCounts()
  return requests.useUpdate({
    ...options,
    onSuccess: (...args) => {
      refresh()
      return options.onSuccess?.(...args)
    },
  })
}

/** requests.useDelete + refresh of the dashboard counters. `mutate(id)` */
export function useDeleteRequest(options = {}) {
  const refresh = useRefreshCounts()
  return requests.useDelete({
    ...options,
    onSuccess: (...args) => {
      refresh()
      return options.onSuccess?.(...args)
    },
  })
}

/** POST /requests/bulk — `mutate({ action: 'status', ids, status })` or `mutate({ action: 'delete', ids })` (≤ 200 ids, 204). */
export function useBulkRequests() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const c = useCommon()
  return useMutation({
    mutationFn: (payload) => api.post('/requests/bulk', payload),
    onSuccess: async (_result, payload) => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: requests.keys.all }), queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })])
      toast.success(payload.action === 'delete' ? c.deleted : c.saved)
    },
    onError: (err) => toast.error(errorText(err, c)),
  })
}

const today = () => new Date().toISOString().slice(0, 10).replaceAll('-', '')

/** GET /requests/export with the list's filters → saves the CSV. `mutate({ status, from, to, search, sort, dir })` */
export function useExportRequests() {
  return useMutation({
    mutationFn: async (params) => {
      const { blob, filename } = await api.download('/requests/export', params)
      saveBlob(blob, filename || `requests-${today()}.csv`)
    },
  })
}
