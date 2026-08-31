import { useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuthSession } from "@/lib/auth/use-auth-session"
import {
  hasRole,
  type UserRole,
} from "@/lib/permissions/roles"
import {
  dashboardReportKeys,
  fetchBillingSummary,
  fetchLaboratoryMostRequested,
  fetchLowStock,
  fetchMedicationsDispensed,
  fetchPatientsMostFrequent,
} from "@/features/dashboard/api/reports"

const REPORT_LIMIT = 5

export function useDashboardReports() {
  const { session } = useAuthSession()
  const queryClient = useQueryClient()
  const roles = session?.user.roles ?? []
  const isAdmin = hasRole(roles, "Admin")
  const isPharmacy = hasRole(roles, "Farmacia")
  const isLaboratory = hasRole(roles, "Laboratorio")

  const billing = useQuery({
    queryKey: dashboardReportKeys.billing(),
    queryFn: fetchBillingSummary,
    enabled: isAdmin,
  })
  const patientsMostFrequent = useQuery({
    queryKey: dashboardReportKeys.patientsMostFrequent(REPORT_LIMIT),
    queryFn: () => fetchPatientsMostFrequent(REPORT_LIMIT),
    enabled: isAdmin,
  })
  const medicationsDispensed = useQuery({
    queryKey: dashboardReportKeys.medicationsDispensed(REPORT_LIMIT),
    queryFn: () => fetchMedicationsDispensed(REPORT_LIMIT),
    enabled: isPharmacy,
  })
  const lowStock = useQuery({
    queryKey: dashboardReportKeys.lowStock(),
    queryFn: fetchLowStock,
    enabled: isPharmacy,
  })
  const laboratoryMostRequested = useQuery({
    queryKey: dashboardReportKeys.laboratoryMostRequested(REPORT_LIMIT),
    queryFn: () => fetchLaboratoryMostRequested(REPORT_LIMIT),
    enabled: isLaboratory,
  })

  const activeQueries = [
    { enabled: isAdmin, query: billing },
    { enabled: isAdmin, query: patientsMostFrequent },
    { enabled: isPharmacy, query: medicationsDispensed },
    { enabled: isPharmacy, query: lowStock },
    { enabled: isLaboratory, query: laboratoryMostRequested },
  ]
    .filter((entry) => entry.enabled)
    .map((entry) => entry.query)

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: dashboardReportKeys.all(),
      refetchType: "active",
    })
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
    isFetching: activeQueries.some((query) => query.isFetching),
    lastUpdatedAt: Math.max(
      0,
      ...activeQueries.map((query) => query.dataUpdatedAt)
    ),
    refresh,
  }
}

export type DashboardReports = ReturnType<typeof useDashboardReports>

export function hasReportRole(roles: readonly UserRole[]) {
  return roles.some((role) => ["Admin", "Farmacia", "Laboratorio"].includes(role))
}
