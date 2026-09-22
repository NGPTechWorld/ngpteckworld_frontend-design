import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCommon } from '@/i18n'
import { api } from '@/lib/api'
import { errorText } from '@/lib/errors'
import { useToast } from '@/ui'

export const SETTINGS_KEY = ['settings']

/**
 * GET /settings → { email, phone, facebook, instagram, linkedin, x, whatsapp }.
 * `gcTime: 0`: nothing is kept after leaving the page, so opening it again always shows what the server has now
 * (the form reads its defaults once, so a stale cache would show old values).
 */
export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: ({ signal }) => api.get('/settings', undefined, { signal }).then((res) => res.data),
    gcTime: 0,
  })
}

/** PUT /settings (partial) → the saved settings. Errors: 422 is left to the form, the rest is toasted here. */
export function useSaveSettings() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const c = useCommon()
  return useMutation({
    mutationFn: (payload) => api.put('/settings', payload).then((res) => res.data),
    onSuccess: (saved) => {
      queryClient.setQueryData(SETTINGS_KEY, saved)
      toast.success(c.saved)
    },
    onError: (err) => toast.error(errorText(err, c)),
  })
}
