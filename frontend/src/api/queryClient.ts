import { QueryClient } from '@tanstack/react-query'

import { ApiError } from './client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        failureCount < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      refetchOnWindowFocus: false,
    },
  },
})
