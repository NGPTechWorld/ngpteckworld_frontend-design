import { QueryClient } from '@tanstack/react-query'

/**
 * refetchOnWindowFocus is off on purpose: a refetch while an edit form is open must never replace what the
 * user is typing. Only network failures and 5xx are retried (once).
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => (error?.status === 0 || error?.status >= 500) && failureCount < 1,
      },
    },
  })
}

export const queryClient = createQueryClient()
