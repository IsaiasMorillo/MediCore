import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { PermissionDenied } from "@/components/feedback/feedback-states"
import { InternalAppShell } from "@/components/layout/internal-app-shell"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import {
  hasAnyRole,
  hasRole,
  isInternalUser,
  type UserRole,
} from "@/lib/permissions/roles"

function getRedirectState(pathname: string, search: string) {
  return { from: `${pathname}${search}` }
}

export function RequireInternalAccess() {
  const { session } = useAuthSession()
  const location = useLocation()

  if (!session) {
    return (
      <Navigate
        replace
        state={getRedirectState(location.pathname, location.search)}
        to="/login"
      />
    )
  }

  if (hasRole(session.user.roles, "Paciente")) {
    return <Navigate replace to="/portal" />
  }

  if (!isInternalUser(session.user.roles)) {
    return <PermissionDenied description="Tu cuenta no tiene un rol de personal interno habilitado." />
  }

  return <InternalAppShell />
}

export function RequireRoles({
  roles,
  children,
}: {
  roles: readonly UserRole[]
  children: ReactNode
}) {
  const { session } = useAuthSession()
  const location = useLocation()

  if (!session) {
    return (
      <Navigate
        replace
        state={getRedirectState(location.pathname, location.search)}
        to="/login"
      />
    )
  }

  if (!hasAnyRole(session.user.roles, roles)) {
    return <PermissionDenied />
  }

  return children
}

export function RequirePatientAccess({ children }: { children: ReactNode }) {
  const { session } = useAuthSession()
  const location = useLocation()

  if (!session) {
    return (
      <Navigate
        replace
        state={getRedirectState(location.pathname, location.search)}
        to="/login"
      />
    )
  }

  if (!hasRole(session.user.roles, "Paciente")) {
    return <Navigate replace to="/app" />
  }

  return children
}
