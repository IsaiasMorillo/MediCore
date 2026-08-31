import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { configureApiClient } from "@/lib/api/client"
import { authSessionContext } from "@/lib/auth/auth-session-context"
import {
  isSessionExpired,
  readStoredSession,
  SESSION_STORAGE_KEY,
  type AuthSession,
} from "@/lib/auth/session"
import {
  hasAnyRole,
  hasRole,
  type UserRole,
} from "@/lib/permissions/roles"

interface AuthSessionProviderProps {
  children: ReactNode
  onSessionCleared?: () => void
}

export function AuthSessionProvider({
  children,
  onSessionCleared,
}: AuthSessionProviderProps) {
  const [session, setSessionState] = useState<AuthSession | null>(() =>
    readStoredSession()
  )
  const sessionRef = useRef(session)
  const onSessionClearedRef = useRef(onSessionCleared)

  useLayoutEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    onSessionClearedRef.current = onSessionCleared
  }, [onSessionCleared])

  const clearSession = useCallback(() => {
    setSessionState(null)

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }

    onSessionClearedRef.current?.()
  }, [])

  const setSession = useCallback(
    (nextSession: AuthSession) => {
      if (isSessionExpired(nextSession)) {
        clearSession()
        return
      }

      setSessionState(nextSession)
    },
    [clearSession]
  )

  useEffect(() => {
    if (session) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } else {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [session])

  useLayoutEffect(() => {
    configureApiClient({
      getToken: () => sessionRef.current?.token ?? null,
      onUnauthorized: clearSession,
    })

    return () => configureApiClient({})
  }, [clearSession])

  useEffect(() => {
    if (!session) {
      return
    }

    const remainingTime = Date.parse(session.expiresAt) - Date.now()
    const timeout = window.setTimeout(
      clearSession,
      Math.max(0, Math.min(remainingTime, 2_147_483_647))
    )

    return () => window.clearTimeout(timeout)
  }, [clearSession, session])

  const value = {
    session,
    setSession,
    clearSession,
    hasRole: (role: UserRole) => hasRole(session?.user.roles ?? [], role),
    hasAnyRole: (roles: readonly UserRole[]) =>
      hasAnyRole(session?.user.roles ?? [], roles),
  }

  return <authSessionContext.Provider value={value}>{children}</authSessionContext.Provider>
}
