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
const LazyDoctorCreatePage = lazy(() => import("@/features/doctors/pages/doctor-form-page").then(({ DoctorCreatePage: page }) => ({ default: page })))
const LazyDoctorDetailPage = lazy(() => import("@/features/doctors/pages/doctor-detail-page").then(({ DoctorDetailPage: page }) => ({ default: page })))
const LazyDoctorEditPage = lazy(() => import("@/features/doctors/pages/doctor-form-page").then(({ DoctorEditPage: page }) => ({ default: page })))
const LazyDoctorsPage = lazy(() => import("@/features/doctors/pages/doctors-page").then(({ DoctorsPage: page }) => ({ default: page })))
const LazyAppointmentCreatePage = lazy(() => import("@/features/appointments/pages/appointment-create-page").then(({ AppointmentCreatePage: page }) => ({ default: page })))
const LazyAppointmentDetailPage = lazy(() => import("@/features/appointments/pages/appointment-detail-page").then(({ AppointmentDetailPage: page }) => ({ default: page })))
const LazyAppointmentsPage = lazy(() => import("@/features/appointments/pages/appointments-page").then(({ AppointmentsPage: page }) => ({ default: page })))
const LazyMedicalRecordCreatePage = lazy(() => import("@/features/medical-records/pages/medical-record-create-page").then(({ MedicalRecordCreatePage: page }) => ({ default: page })))
const LazyMedicalRecordDetailPage = lazy(() => import("@/features/medical-records/pages/medical-record-detail-page").then(({ MedicalRecordDetailPage: page }) => ({ default: page })))
const LazyMedicalRecordSearchPage = lazy(() => import("@/features/medical-records/pages/medical-record-search-page").then(({ MedicalRecordSearchPage: page }) => ({ default: page })))
const LazyPatientMedicalRecordsPage = lazy(() => import("@/features/medical-records/pages/patient-medical-records-page").then(({ PatientMedicalRecordsPage: page }) => ({ default: page })))
const LazyNursingPage = lazy(() => import("@/features/nursing/pages/nursing-page").then(({ NursingPage: page }) => ({ default: page })))
const LazyNursingVitalsCreatePage = lazy(() => import("@/features/nursing/pages/nursing-vitals-create-page").then(({ NursingVitalsCreatePage: page }) => ({ default: page })))
const LazyLaboratoryPage = lazy(() => import("@/features/laboratory/pages/laboratory-page").then(({ LaboratoryPage: page }) => ({ default: page })))
const LazyLaboratoryOrderCreatePage = lazy(() => import("@/features/laboratory/pages/laboratory-order-create-page").then(({ LaboratoryOrderCreatePage: page }) => ({ default: page })))
const LazyLaboratoryOrderDetailPage = lazy(() => import("@/features/laboratory/pages/laboratory-order-detail-page").then(({ LaboratoryOrderDetailPage: page }) => ({ default: page })))
const LazyLaboratoryResultsPage = lazy(() => import("@/features/laboratory/pages/laboratory-results-page").then(({ LaboratoryResultsPage: page }) => ({ default: page })))
const LazyPharmacyMedicationsPage = lazy(() => import("@/features/pharmacy/pages/pharmacy-medications-page").then(({ PharmacyMedicationsPage: page }) => ({ default: page })))
const LazyPharmacyMedicationCreatePage = lazy(() => import("@/features/pharmacy/pages/pharmacy-medication-create-page").then(({ PharmacyMedicationCreatePage: page }) => ({ default: page })))
const LazyPharmacyMedicationEditPage = lazy(() => import("@/features/pharmacy/pages/pharmacy-medication-edit-page").then(({ PharmacyMedicationEditPage: page }) => ({ default: page })))
const LazyPharmacyPrescriptionsPage = lazy(() => import("@/features/pharmacy/pages/pharmacy-prescriptions-page").then(({ PharmacyPrescriptionsPage: page }) => ({ default: page })))
const LazyBillingPage = lazy(() => import("@/features/billing/pages/billing-page").then(({ BillingPage: page }) => ({ default: page })))
const LazyBillingInvoiceDetailPage = lazy(() => import("@/features/billing/pages/billing-invoice-detail-page").then(({ BillingInvoiceDetailPage: page }) => ({ default: page })))

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

export function DoctorsRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyDoctorsPage />
    </Suspense>
  )
}

export function AppointmentsRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyAppointmentsPage />
    </Suspense>
  )
}

export function AppointmentCreateRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyAppointmentCreatePage />
    </Suspense>
  )
}

export function AppointmentDetailRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyAppointmentDetailPage />
    </Suspense>
  )
}

export function MedicalRecordCreateRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyMedicalRecordCreatePage />
    </Suspense>
  )
}

export function MedicalRecordDetailRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyMedicalRecordDetailPage />
    </Suspense>
  )
}

export function MedicalRecordSearchRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyMedicalRecordSearchPage />
    </Suspense>
  )
}

export function PatientMedicalRecordsRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyPatientMedicalRecordsPage />
    </Suspense>
  )
}

export function NursingRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyNursingPage />
    </Suspense>
  )
}

export function NursingVitalsCreateRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyNursingVitalsCreatePage />
    </Suspense>
  )
}

export function LaboratoryRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyLaboratoryPage />
    </Suspense>
  )
}

export function LaboratoryOrderCreateRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyLaboratoryOrderCreatePage />
    </Suspense>
  )
}

export function LaboratoryOrderDetailRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyLaboratoryOrderDetailPage />
    </Suspense>
  )
}

export function LaboratoryResultsRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyLaboratoryResultsPage />
    </Suspense>
  )
}

export function PharmacyMedicationsRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyPharmacyMedicationsPage />
    </Suspense>
  )
}

export function PharmacyMedicationCreateRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyPharmacyMedicationCreatePage />
    </Suspense>
  )
}

export function PharmacyMedicationEditRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyPharmacyMedicationEditPage />
    </Suspense>
  )
}

export function PharmacyPrescriptionsRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyPharmacyPrescriptionsPage />
    </Suspense>
  )
}

export function BillingRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyBillingPage />
    </Suspense>
  )
}

export function BillingInvoiceDetailRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyBillingInvoiceDetailPage />
    </Suspense>
  )
}

export function DoctorCreateRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyDoctorCreatePage />
    </Suspense>
  )
}

export function DoctorDetailRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyDoctorDetailPage />
    </Suspense>
  )
}

export function DoctorEditRoute() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <LazyDoctorEditPage />
    </Suspense>
  )
}
