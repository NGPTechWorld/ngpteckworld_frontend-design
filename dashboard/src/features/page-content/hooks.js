import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { createCrudHooks } from '@/lib/crud'

/** Repeatable content (process steps, values, why-us): one line gives list / create / update / delete / reorder. */
export const contentItems = createCrudHooks('/content-items')

// The API's default page size is 15 and the reorder endpoint needs every id of the collection, so always ask for the maximum.
export const COLLECTION_PAGE_SIZE = 200
export const collectionParams = (collection) => ({ collection, per_page: COLLECTION_PAGE_SIZE, sort: 'order', dir: 'asc' })

export const TEXTS_KEY = ['page-content', 'texts']

/**
 * The fixed texts, grouped: `[{ group, label, label_ar, items: [{ key, label, label_ar, type, value_ar, value_en }] }]`.
 * The form is built from the first response and is never reset by a refetch (that would wipe what the user is typing),
 * so the query does not refetch by itself, and it is dropped as soon as the page closes: coming back always starts from
 * the server's current values.
 */
export function useTexts() {
  return useQuery({
    queryKey: TEXTS_KEY,
    queryFn: ({ signal }) => api.get('/content/texts', undefined, { signal }).then((res) => res.data),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

/** `mutateAsync(items)` sends `PUT /content/texts { items }` and puts the answer (same shape as the GET) into the cache. */
export function useSaveTexts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items) => api.put('/content/texts', { items }).then((res) => res.data),
    onSuccess: (groups) => queryClient.setQueryData(TEXTS_KEY, groups),
  })
}
