import type { UserRole } from "@/lib/permissions/roles"
import { INTERNAL_ROLES as INTERNAL_STAFF_ROLES } from "@/lib/permissions/roles"

export const INTERNAL_ROLES = INTERNAL_STAFF_ROLES
export const PATIENT_WRITE_ROLES = ["Admin", "Recepcion"] as const satisfies readonly UserRole[]
export const PATIENT_DELETE_ROLES = ["Admin"] as const satisfies readonly UserRole[]
export const DOCTOR_MANAGE_ROLES = ["Admin"] as const satisfies readonly UserRole[]
export const APPOINTMENT_WRITE_ROLES = ["Admin", "Recepcion"] as const satisfies readonly UserRole[]

export const CLINICAL_ROLES = ["Admin", "Medico"] as const satisfies readonly UserRole[]
export const NURSING_WRITE_ROLES = ["Admin", "Enfermero"] as const satisfies readonly UserRole[]
export const NURSING_ROLES = [
  "Admin",
  "Medico",
  "Enfermero",
] as const satisfies readonly UserRole[]
export const LABORATORY_ROLES = [
  "Admin",
  "Medico",
  "Laboratorio",
] as const satisfies readonly UserRole[]
export const LABORATORY_ORDER_WRITE_ROLES = ["Admin", "Medico"] as const satisfies readonly UserRole[]
export const LABORATORY_RESULT_WRITE_ROLES = ["Admin", "Laboratorio"] as const satisfies readonly UserRole[]
export const PHARMACY_ROLES = [
  "Admin",
  "Medico",
  "Farmacia",
] as const satisfies readonly UserRole[]
export const PHARMACY_MANAGE_ROLES = ["Admin", "Farmacia"] as const satisfies readonly UserRole[]
export const PRESCRIPTION_WRITE_ROLES = ["Admin", "Medico"] as const satisfies readonly UserRole[]
export const BILLING_ROLES = ["Admin", "Recepcion"] as const satisfies readonly UserRole[]
export const REPORT_ROLES = [
  "Admin",
  "Farmacia",
  "Laboratorio",
] as const satisfies readonly UserRole[]
