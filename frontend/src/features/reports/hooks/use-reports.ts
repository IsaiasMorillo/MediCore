import { useQuery } from "@tanstack/react-query"

import { useAuthSession } from "@/lib/auth/use-auth-session"
import { hasRole } from "@/lib/permissions/roles"
import {
  fetchBillingSummary,
  fetchLaboratoryMostRequested,
  fetchLowStock,
  fetchMedicationsDispensed,
  fetchPatientsMostFrequent,
  reportKeys,
} from "@/features/reports/api/reports-api"
import type {
  BillingReportFilters,
  ReportSection,
} from "@/features/reports/types"

const REPORT_LIMIT = 10

export function useReports(
  section: ReportSection,
  billingFilters: BillingReportFilters
) {
  const { session } = useAuthSession()
  const roles = session?.user.roles ?? []
  const isAdmin = hasRole(roles, "Admin")
  const isPharmacy = hasRole(roles, "Farmacia")
  const isLaboratory = hasRole(roles, "Laboratorio")
  const canViewPharmacyReports = isAdmin || isPharmacy
  const canViewLaboratoryReports = isAdmin || isLaboratory
  const showBillingReports = isAdmin && (section === "overview" || section === "billing")
  const showPharmacyReports =
    canViewPharmacyReports && (section === "overview" || section === "pharmacy")
  const showLaboratoryReports =
    canViewLaboratoryReports && (section === "overview" || section === "laboratory")

  const billing = useQuery({
    enabled: showBillingReports,
    placeholderData: (previousData) => previousData,
    queryFn: () => fetchBillingSummary(billingFilters),
    queryKey: reportKeys.billing(billingFilters.from, billingFilters.to),
  })
  const patientsMostFrequent = useQuery({
    enabled: showBillingReports,
    queryFn: () => fetchPatientsMostFrequent(REPORT_LIMIT),
    queryKey: reportKeys.patientsMostFrequent(REPORT_LIMIT),
  })
  const medicationsDispensed = useQuery({
    enabled: showPharmacyReports,
    queryFn: () => fetchMedicationsDispensed(REPORT_LIMIT),
    queryKey: reportKeys.medicationsDispensed(REPORT_LIMIT),
  })
  const lowStock = useQuery({
    enabled: showPharmacyReports,
    queryFn: fetchLowStock,
    queryKey: reportKeys.lowStock(),
  })
  const laboratoryMostRequested = useQuery({
    enabled: showLaboratoryReports,
    queryFn: () => fetchLaboratoryMostRequested(REPORT_LIMIT),
    queryKey: reportKeys.laboratoryMostRequested(REPORT_LIMIT),
  })

  const activeQueries = [
    { enabled: showBillingReports, query: billing },
    { enabled: showBillingReports, query: patientsMostFrequent },
    { enabled: showPharmacyReports, query: medicationsDispensed },
    { enabled: showPharmacyReports, query: lowStock },
    { enabled: showLaboratoryReports, query: laboratoryMostRequested },
  ]
    .filter((entry) => entry.enabled)
    .map((entry) => entry.query)

  const refresh = async () => {
    await Promise.all(activeQueries.map((query) => query.refetch()))
  }

  return {
    billing,
    patientsMostFrequent,
    medicationsDispensed,
    lowStock,
    laboratoryMostRequested,
    isAdmin,
    isPharmacy,
    isLaboratory,
    canViewPharmacyReports,
    canViewLaboratoryReports,
    isFetching: activeQueries.some((query) => query.isFetching),
    lastUpdatedAt: Math.max(
      0,
      ...activeQueries.map((query) => query.dataUpdatedAt)
    ),
    refresh,
  }
}

export type ReportsQueryState = ReturnType<typeof useReports>
