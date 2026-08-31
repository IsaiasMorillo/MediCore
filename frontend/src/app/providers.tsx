import {
  QueryClientProvider,
} from "@tanstack/react-query"
import { type ReactNode } from "react"

import { queryClient } from "@/app/query-client"
import { AuthSessionProvider } from "@/lib/auth/auth-session-provider"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider onSessionCleared={() => queryClient.clear()}>
        {children}
      </AuthSessionProvider>
    </QueryClientProvider>
  )
}
