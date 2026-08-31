import { createContext } from "react"

import type { AuthSession } from "@/lib/auth/session"
import type { UserRole } from "@/lib/permissions/roles"

export interface AuthSessionContextValue {
  session: AuthSession | null
  setSession: (session: AuthSession) => void
  clearSession: () => void
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: readonly UserRole[]) => boolean
}

export const authSessionContext = createContext<AuthSessionContextValue | null>(null)
