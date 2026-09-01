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
  DashboardRoute,
  ForgotPasswordRoute,
  LoginRoute,
  PatientAccountRoute,
  PatientCreateRoute,
  PatientDetailRoute,
  PatientEditRoute,
  PatientsRoute,
  ResetPasswordRoute,
} from "@/app/route-elements"
import {
  BILLING_ROLES,
  CLINICAL_ROLES,
  INTERNAL_ROLES,
  LABORATORY_ROLES,
  NURSING_ROLES,
  PATIENT_WRITE_ROLES,
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
            <ModulePlaceholderPage moduleId="appointments" />
          </RequireRoles>
        ),
      },
      {
        path: "doctors",
        element: (
          <RequireRoles roles={INTERNAL_ROLES}>
            <ModulePlaceholderPage moduleId="doctors" />
          </RequireRoles>
        ),
      },
      {
        path: "medical-records",
        element: (
          <RequireRoles roles={CLINICAL_ROLES}>
            <ModulePlaceholderPage moduleId="medical-records" />
          </RequireRoles>
        ),
      },
      {
        path: "nursing",
        element: (
          <RequireRoles roles={NURSING_ROLES}>
            <ModulePlaceholderPage moduleId="nursing" />
          </RequireRoles>
        ),
      },
      {
        path: "laboratory",
        element: (
          <RequireRoles roles={LABORATORY_ROLES}>
            <ModulePlaceholderPage moduleId="laboratory" />
          </RequireRoles>
        ),
      },
      {
        path: "pharmacy",
        element: (
          <RequireRoles roles={PHARMACY_ROLES}>
            <ModulePlaceholderPage moduleId="pharmacy" />
          </RequireRoles>
        ),
      },
      {
        path: "billing",
        element: (
          <RequireRoles roles={BILLING_ROLES}>
            <ModulePlaceholderPage moduleId="billing" />
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
