import { apiRequest } from "@/lib/api/client"

import type {
  BillingReportRow,
  CategoryCountRow,
  LowStockRow,
  MedicationDispensedRow,
} from "@/features/dashboard/types"

export const dashboardReportKeys = {
  all: () => ["reports"] as const,
  billing: () => ["reports", "billing", null, null] as const,
  medicationsDispensed: (limit: number) =>
    ["reports", "medications-dispensed", limit] as const,
  laboratoryMostRequested: (limit: number) =>
    ["reports", "laboratory-most-requested", limit] as const,
  patientsMostFrequent: (limit: number) =>
    ["reports", "patients-most-frequent", limit] as const,
  lowStock: () => ["reports", "low-stock"] as const,
}

export function fetchBillingSummary() {
  return apiRequest<BillingReportRow[]>("/api/reports/invoices-summary")
}

export function fetchMedicationsDispensed(limit = 5) {
  return apiRequest<MedicationDispensedRow[]>(
    `/api/reports/medications-dispensed?limit=${limit}`
  )
}

export function fetchLaboratoryMostRequested(limit = 5) {
  return apiRequest<CategoryCountRow[]>(
    `/api/reports/laboratory-most-requested?limit=${limit}`
  )
}

export function fetchPatientsMostFrequent(limit = 5) {
  return apiRequest<CategoryCountRow[]>(
    `/api/reports/patients-most-frequent?limit=${limit}`
  )
}

export function fetchLowStock() {
  return apiRequest<LowStockRow[]>("/api/reports/low-stock")
}
