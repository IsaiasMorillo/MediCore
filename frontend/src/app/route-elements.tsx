import { lazy, Suspense } from "react"
import { Navigate } from "react-router-dom"

import {
  LoginRequiredPage,
  RouteLoadingState,
} from "@/components/feedback/feedback-states"
import { useAuthSession } from "@/lib/auth/use-auth-session"

const DashboardPage = lazy(() =>
  import("@/features/dashboard/pages/dashboard-page").then(({ DashboardPage: page }) => ({
    default: page,
  }))
)

export function DashboardRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <DashboardPage />
    </Suspense>
  )
}

export function LoginRoute() {
  const { session } = useAuthSession()

  if (session?.user.roles.includes("Paciente")) {
    return <Navigate replace to="/portal" />
  }

  if (session) {
    return <Navigate replace to="/app" />
  }

  return <LoginRequiredPage />
}
