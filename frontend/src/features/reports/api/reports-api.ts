import { apiRequest } from "@/lib/api/client"

import type {
  BillingReportFilters,
  BillingReportRow,
  CategoryCountRow,
  LowStockRow,
  MedicationDispensedRow,
} from "@/features/reports/types"

export const reportKeys = {
  all: () => ["reports"] as const,
  billing: (from?: string, to?: string) =>
    ["reports", "billing", from ?? null, to ?? null] as const,
  medicationsDispensed: (limit: number) =>
    ["reports", "medications-dispensed", limit] as const,
  laboratoryMostRequested: (limit: number) =>
    ["reports", "laboratory-most-requested", limit] as const,
  patientsMostFrequent: (limit: number) =>
    ["reports", "patients-most-frequent", limit] as const,
  lowStock: () => ["reports", "low-stock"] as const,
}

export function fetchBillingSummary(filters: BillingReportFilters = {}) {
  return apiRequest<BillingReportRow[]>(
    appendQuery("/api/reports/invoices-summary", filters)
  )
}

export function fetchMedicationsDispensed(limit = 5) {
  return apiRequest<MedicationDispensedRow[]>(
    appendQuery("/api/reports/medications-dispensed", { limit })
  )
}

export function fetchLaboratoryMostRequested(limit = 5) {
  return apiRequest<CategoryCountRow[]>(
    appendQuery("/api/reports/laboratory-most-requested", { limit })
  )
}

export function fetchPatientsMostFrequent(limit = 5) {
  return apiRequest<CategoryCountRow[]>(
    appendQuery("/api/reports/patients-most-frequent", { limit })
  )
}

export function fetchLowStock() {
  return apiRequest<LowStockRow[]>("/api/reports/low-stock")
}

function appendQuery(
  path: string,
  values: {
    from?: string
    limit?: number
    to?: string
  }
) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value))
    }
  }

  const query = params.toString()
  return query ? `${path}?${query}` : path
}
