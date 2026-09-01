import { lazy, Suspense } from "react"
import { Navigate } from "react-router-dom"

import { RouteLoadingState } from "@/components/feedback/feedback-states"
import { useAuthSession } from "@/lib/auth/use-auth-session"

const DashboardPage = lazy(() => import("@/features/dashboard/pages/dashboard-page").then(({ DashboardPage: page }) => ({ default: page })))
const LazyAdminAccountPage = lazy(() => import("@/features/auth/pages/admin-account-page").then(({ AdminAccountPage: page }) => ({ default: page })))
const LazyForgotPasswordPage = lazy(() => import("@/features/auth/pages/forgot-password-page").then(({ ForgotPasswordPage: page }) => ({ default: page })))
const LazyLoginPage = lazy(() => import("@/features/auth/pages/login-page").then(({ LoginPage: page }) => ({ default: page })))
const LazyPatientAccountPage = lazy(() => import("@/features/auth/pages/patient-account-page").then(({ PatientAccountPage: page }) => ({ default: page })))
const LazyResetPasswordPage = lazy(() => import("@/features/auth/pages/reset-password-page").then(({ ResetPasswordPage: page }) => ({ default: page })))
const LazyPatientCreatePage = lazy(() => import("@/features/patients/pages/patient-form-page").then(({ PatientCreatePage: page }) => ({ default: page })))
const LazyPatientDetailPage = lazy(() => import("@/features/patients/pages/patient-detail-page").then(({ PatientDetailPage: page }) => ({ default: page })))
const LazyPatientEditPage = lazy(() => import("@/features/patients/pages/patient-form-page").then(({ PatientEditPage: page }) => ({ default: page })))
const LazyPatientsPage = lazy(() => import("@/features/patients/pages/patients-page").then(({ PatientsPage: page }) => ({ default: page })))

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

  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyLoginPage />
    </Suspense>
  )
}

export function ForgotPasswordRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyForgotPasswordPage />
    </Suspense>
  )
}

export function ResetPasswordRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyResetPasswordPage />
    </Suspense>
  )
}

export function AdminAccountRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyAdminAccountPage />
    </Suspense>
  )
}

export function PatientAccountRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyPatientAccountPage />
    </Suspense>
  )
}

export function PatientsRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyPatientsPage />
    </Suspense>
  )
}

export function PatientCreateRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyPatientCreatePage />
    </Suspense>
  )
}

export function PatientDetailRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyPatientDetailPage />
    </Suspense>
  )
}

export function PatientEditRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyPatientEditPage />
    </Suspense>
  )
}
