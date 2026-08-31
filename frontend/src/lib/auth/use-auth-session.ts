import { useContext } from "react"

import { authSessionContext } from "@/lib/auth/auth-session-context"

export function useAuthSession() {
  const context = useContext(authSessionContext)

  if (!context) {
    throw new Error("useAuthSession must be used inside AuthSessionProvider")
  }

  return context
}
