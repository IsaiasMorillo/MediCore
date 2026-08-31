import { QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/lib/api/client"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && [0, 401, 403, 404].includes(error.status)) {
          return false
        }

        return failureCount < 1
      },
    },
  },
})
