import { apiRequest } from "@/lib/api/client"

import type {
  ActivePrescription,
  PortalInvoice,
  PortalLaboratoryResult,
  UpcomingAppointment,
} from "@/features/patient-portal/types"

export const patientPortalKeys = {
  all: () => ["patient-portal"] as const,
  appointments: () => ["patient-portal", "appointments"] as const,
  prescriptions: () => ["patient-portal", "prescriptions"] as const,
  invoices: () => ["patient-portal", "invoices"] as const,
  laboratoryResults: () => ["patient-portal", "laboratory-results"] as const,
}

export function getPortalUpcomingAppointments() {
  return apiRequest<UpcomingAppointment[]>("/api/patient-portal/upcoming-appointments")
}

export function getPortalActivePrescriptions() {
  return apiRequest<ActivePrescription[]>("/api/patient-portal/active-prescriptions")
}

export function getPortalInvoices() {
  return apiRequest<PortalInvoice[]>("/api/patient-portal/invoices")
}

export function getPortalLaboratoryResults() {
  return apiRequest<PortalLaboratoryResult[]>("/api/patient-portal/laboratory-results")
}
