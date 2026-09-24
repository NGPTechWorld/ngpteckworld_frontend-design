import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCommon } from '@/i18n'
import { api } from '@/lib/api'
import { errorText } from '@/lib/errors'
import { useToast } from '@/ui'

export const MY_PROFILE_KEY = ['my-profile']

/** GET /my-profile → the team profile linked to the signed-in account (404 when none is). */
export function useMyProfile({ enabled = true } = {}) {
  return useQuery({
    queryKey: MY_PROFILE_KEY,
    queryFn: ({ signal }) => api.get('/my-profile', undefined, { signal }).then((res) => res.data),
    enabled,
    gcTime: 0,
  })
}

/** PUT /my-profile → the saved profile. Errors are toasted here; a 422 also puts its messages on the fields (the form does that). */
export function useSaveMyProfile() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const c = useCommon()
  return useMutation({
    mutationFn: (payload) => api.put('/my-profile', payload).then((res) => res.data),
    onSuccess: (saved) => {
      queryClient.setQueryData(MY_PROFILE_KEY, saved)
      toast.success(c.saved)
    },
    onError: (err) => toast.error(errorText(err, c)),
  })
}
