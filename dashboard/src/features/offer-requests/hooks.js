import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommon } from '@/i18n'
import { api } from '@/lib/api'
import { createCrudHooks } from '@/lib/crud'
import { errorText } from '@/lib/errors'
import { useToast } from '@/ui'

// offerRequests.useList / useOne / useUpdate / useDelete
export const offerRequests = createCrudHooks('/offer-requests')

export const TYPES = ['booking', 'inquiry']

/** POST /offer-requests/bulk — `mutate({ action: 'status', ids, status })` or `mutate({ action: 'delete', ids })`. */
export function useBulkOfferRequests() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const c = useCommon()
  return useMutation({
    mutationFn: (payload) => api.post('/offer-requests/bulk', payload),
    onSuccess: async (_result, payload) => {
      await queryClient.invalidateQueries({ queryKey: offerRequests.keys.all })
      toast.success(payload.action === 'delete' ? c.deleted : c.saved)
    },
    onError: (err) => toast.error(errorText(err, c)),
  })
}
