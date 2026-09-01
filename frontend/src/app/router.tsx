import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom"

import {
  NotFoundPage,
  PatientPortalPendingPage,
} from "@/components/feedback/feedback-states"
import {
  AdminAccountRoute,
  AppointmentCreateRoute,
  AppointmentDetailRoute,
  AppointmentsRoute,
  BillingInvoiceDetailRoute,
  BillingRoute,
  DashboardRoute,
  DoctorCreateRoute,
  DoctorDetailRoute,
  DoctorEditRoute,
  DoctorsRoute,
  ForgotPasswordRoute,
  LaboratoryOrderCreateRoute,
  LaboratoryOrderDetailRoute,
  LaboratoryResultsRoute,
  LaboratoryRoute,
  LoginRoute,
  MedicalRecordCreateRoute,
  MedicalRecordDetailRoute,
  MedicalRecordSearchRoute,
  NursingRoute,
  NursingVitalsCreateRoute,
  PatientAccountRoute,
  PatientCreateRoute,
  PatientDetailRoute,
  PatientEditRoute,
  PatientMedicalRecordsRoute,
  PatientsRoute,
  PharmacyMedicationCreateRoute,
  PharmacyMedicationEditRoute,
  PharmacyMedicationsRoute,
  PharmacyPrescriptionsRoute,
  ResetPasswordRoute,
} from "@/app/route-elements"
import {
  BILLING_ROLES,
  APPOINTMENT_WRITE_ROLES,
  CLINICAL_ROLES,
  INTERNAL_ROLES,
  LABORATORY_ORDER_WRITE_ROLES,
  LABORATORY_RESULT_WRITE_ROLES,
  LABORATORY_ROLES,
  NURSING_ROLES,
  NURSING_WRITE_ROLES,
  PATIENT_WRITE_ROLES,
  DOCTOR_MANAGE_ROLES,
  PHARMACY_MANAGE_ROLES,
  PHARMACY_ROLES,
  REPORT_ROLES,
} from "@/lib/permissions/route-roles"
import { ModulePlaceholderPage } from "@/features/dashboard/pages/module-placeholder-page"
import {
  RequireInternalAccess,
  RequirePatientAccess,
  RequireRoles,
} from "@/app/route-guards"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate replace to="/app" />,
  },
  {
    path: "/login",
    element: <LoginRoute />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordRoute />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordRoute />,
  },
  {
    path: "/portal",
    element: (
      <RequirePatientAccess>
        <PatientPortalPendingPage />
      </RequirePatientAccess>
    ),
  },
  {
    path: "/app",
    element: <RequireInternalAccess />,
    children: [
      { index: true, element: <DashboardRoute /> },
      {
        path: "patients",
        element: (
          <RequireRoles roles={INTERNAL_ROLES}>
            <PatientsRoute />
          </RequireRoles>
        ),
      },
      {
        path: "patients/new",
        element: (
          <RequireRoles roles={PATIENT_WRITE_ROLES}>
            <PatientCreateRoute />
          </RequireRoles>
        ),
      },
      {
        path: "patients/:patientId",
        element: (
          <RequireRoles roles={INTERNAL_ROLES}>
            <PatientDetailRoute />
          </RequireRoles>
        ),
      },
      {
        path: "patients/:patientId/edit",
        element: (
          <RequireRoles roles={PATIENT_WRITE_ROLES}>
            <PatientEditRoute />
          </RequireRoles>
        ),
      },
      {
        path: "appointments",
        element: (
          <RequireRoles roles={INTERNAL_ROLES}>
            <AppointmentsRoute />
          </RequireRoles>
        ),
      },
      {
        path: "appointments/new",
        element: (
          <RequireRoles roles={APPOINTMENT_WRITE_ROLES}>
            <AppointmentCreateRoute />
          </RequireRoles>
        ),
      },
      {
        path: "appointments/:appointmentId",
        element: (
          <RequireRoles roles={INTERNAL_ROLES}>
            <AppointmentDetailRoute />
          </RequireRoles>
        ),
      },
      {
        path: "doctors",
        element: (
          <RequireRoles roles={INTERNAL_ROLES}>
            <DoctorsRoute />
          </RequireRoles>
        ),
      },
      {
        path: "doctors/new",
        element: (
          <RequireRoles roles={DOCTOR_MANAGE_ROLES}>
            <DoctorCreateRoute />
          </RequireRoles>
        ),
      },
      {
        path: "doctors/:doctorId",
        element: (
          <RequireRoles roles={INTERNAL_ROLES}>
            <DoctorDetailRoute />
          </RequireRoles>
        ),
      },
      {
        path: "doctors/:doctorId/edit",
        element: (
          <RequireRoles roles={DOCTOR_MANAGE_ROLES}>
            <DoctorEditRoute />
          </RequireRoles>
        ),
      },
      {
        path: "medical-records",
        element: (
          <RequireRoles roles={CLINICAL_ROLES}>
            <Navigate replace to="/app/medical-records/search" />
          </RequireRoles>
        ),
      },
      {
        path: "medical-records/search",
        element: (
          <RequireRoles roles={CLINICAL_ROLES}>
            <MedicalRecordSearchRoute />
          </RequireRoles>
        ),
      },
      {
        path: "medical-records/new",
        element: (
          <RequireRoles roles={CLINICAL_ROLES}>
            <MedicalRecordCreateRoute />
          </RequireRoles>
        ),
      },
      {
        path: "medical-records/patient/:patientId",
        element: (
          <RequireRoles roles={CLINICAL_ROLES}>
            <PatientMedicalRecordsRoute />
          </RequireRoles>
        ),
      },
      {
        path: "medical-records/:recordId",
        element: (
          <RequireRoles roles={CLINICAL_ROLES}>
            <MedicalRecordDetailRoute />
          </RequireRoles>
        ),
      },
      {
        path: "nursing",
        element: (
          <RequireRoles roles={NURSING_ROLES}>
            <NursingRoute />
          </RequireRoles>
        ),
      },
      {
        path: "nursing/vitals/new",
        element: (
          <RequireRoles roles={NURSING_WRITE_ROLES}>
            <NursingVitalsCreateRoute />
          </RequireRoles>
        ),
      },
      {
        path: "laboratory",
        element: (
          <RequireRoles roles={LABORATORY_ROLES}>
            <LaboratoryRoute />
          </RequireRoles>
        ),
      },
      {
        path: "laboratory/orders/new",
        element: (
          <RequireRoles roles={LABORATORY_ORDER_WRITE_ROLES}>
            <LaboratoryOrderCreateRoute />
          </RequireRoles>
        ),
      },
      {
        path: "laboratory/orders/:orderId",
        element: (
          <RequireRoles roles={LABORATORY_ROLES}>
            <LaboratoryOrderDetailRoute />
          </RequireRoles>
        ),
      },
      {
        path: "laboratory/orders/:orderId/results",
        element: (
          <RequireRoles roles={LABORATORY_RESULT_WRITE_ROLES}>
            <LaboratoryResultsRoute />
          </RequireRoles>
        ),
      },
      {
        path: "pharmacy",
        element: (
          <RequireRoles roles={PHARMACY_ROLES}>
            <Navigate replace to="/app/pharmacy/medications" />
          </RequireRoles>
        ),
      },
      {
        path: "pharmacy/medications",
        element: (
          <RequireRoles roles={PHARMACY_ROLES}>
            <PharmacyMedicationsRoute />
          </RequireRoles>
        ),
      },
      {
        path: "pharmacy/medications/new",
        element: (
          <RequireRoles roles={PHARMACY_MANAGE_ROLES}>
            <PharmacyMedicationCreateRoute />
          </RequireRoles>
        ),
      },
      {
        path: "pharmacy/medications/:medicationId/edit",
        element: (
          <RequireRoles roles={PHARMACY_MANAGE_ROLES}>
            <PharmacyMedicationEditRoute />
          </RequireRoles>
        ),
      },
      {
        path: "pharmacy/prescriptions",
        element: (
          <RequireRoles roles={PHARMACY_ROLES}>
            <PharmacyPrescriptionsRoute />
          </RequireRoles>
        ),
      },
      {
        path: "pharmacy/prescriptions/patient/:patientId",
        element: (
          <RequireRoles roles={PHARMACY_ROLES}>
            <PharmacyPrescriptionsRoute />
          </RequireRoles>
        ),
      },
      {
        path: "billing",
        element: (
          <RequireRoles roles={BILLING_ROLES}>
            <BillingRoute />
          </RequireRoles>
        ),
      },
      {
        path: "billing/invoices/:invoiceId",
        element: (
          <RequireRoles roles={BILLING_ROLES}>
            <BillingInvoiceDetailRoute />
          </RequireRoles>
        ),
      },
      {
        path: "reports",
        element: (
          <RequireRoles roles={REPORT_ROLES}>
            <ModulePlaceholderPage moduleId="reports" />
          </RequireRoles>
        ),
      },
      {
        path: "admin/accounts",
        element: (
          <RequireRoles roles={["Admin"]}>
            <Navigate replace to="/app/admin/accounts/new" />
          </RequireRoles>
        ),
      },
      {
        path: "admin/accounts/new",
        element: (
          <RequireRoles roles={["Admin"]}>
            <AdminAccountRoute />
          </RequireRoles>
        ),
      },
      {
        path: "admin/patient-accounts/new",
        element: (
          <RequireRoles roles={["Admin"]}>
            <PatientAccountRoute />
          </RequireRoles>
        ),
      },
      {
        path: "admin/patient-accounts",
        element: (
          <RequireRoles roles={["Admin"]}>
            <Navigate replace to="/app/admin/patient-accounts/new" />
          </RequireRoles>
        ),
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
])
