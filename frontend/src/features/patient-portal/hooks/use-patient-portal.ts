import { useQuery, type UseQueryResult } from "@tanstack/react-query"

import { ApiError } from "@/lib/api/client"
import {
  getPortalActivePrescriptions,
  getPortalInvoices,
  getPortalLaboratoryResults,
  getPortalUpcomingAppointments,
  patientPortalKeys,
} from "@/features/patient-portal/api/patient-portal-api"
import type {
  ActivePrescription,
  PortalInvoice,
  PortalLaboratoryResult,
  PortalSection,
  UpcomingAppointment,
} from "@/features/patient-portal/types"

const queryOptions = {
  staleTime: 60 * 1000,
  retry: (failureCount: number, error: Error) => {
    if (error instanceof ApiError && error.status === 403) {
      return false
    }

    return failureCount < 2
  },
}

type PortalQuery<TData> = UseQueryResult<TData, Error>

export function usePatientPortal(section: PortalSection) {
  const showAppointments = section === "overview" || section === "appointments"
  const showPrescriptions = section === "overview" || section === "prescriptions"
  const showInvoices = section === "overview" || section === "invoices"
  const showLaboratoryResults = section === "overview" || section === "laboratory-results"

  const appointments = useQuery({
    ...queryOptions,
    enabled: showAppointments,
    queryFn: getPortalUpcomingAppointments,
    queryKey: patientPortalKeys.appointments(),
  })
  const prescriptions = useQuery({
    ...queryOptions,
    enabled: showPrescriptions,
    queryFn: getPortalActivePrescriptions,
    queryKey: patientPortalKeys.prescriptions(),
  })
  const invoices = useQuery({
    ...queryOptions,
    enabled: showInvoices,
    queryFn: getPortalInvoices,
    queryKey: patientPortalKeys.invoices(),
  })
  const laboratoryResults = useQuery({
    ...queryOptions,
    enabled: showLaboratoryResults,
    queryFn: getPortalLaboratoryResults,
    queryKey: patientPortalKeys.laboratoryResults(),
  })

  const activeQueries = [
    showAppointments ? appointments : undefined,
    showPrescriptions ? prescriptions : undefined,
    showInvoices ? invoices : undefined,
    showLaboratoryResults ? laboratoryResults : undefined,
  ].filter((query): query is NonNullable<typeof query> => query !== undefined)

  const refresh = async () => {
    await Promise.all(activeQueries.map((query) => query.refetch()))
  }

  return {
    appointments,
    prescriptions,
    invoices,
    laboratoryResults,
    isFetching: activeQueries.some((query) => query.isFetching),
    isInitialLoading: activeQueries.some((query) => query.isPending),
    isUnlinked: activeQueries.some((query) => isUnlinkedError(query.error)),
    lastUpdatedAt: Math.max(0, ...activeQueries.map((query) => query.dataUpdatedAt)),
    refresh,
  }
}

function isUnlinkedError(error: Error | null) {
  return error instanceof ApiError && error.status === 403
}

export type PatientPortalQueryState = ReturnType<typeof usePatientPortal>
export type PatientPortalAppointmentsQuery = PortalQuery<UpcomingAppointment[]>
export type PatientPortalPrescriptionsQuery = PortalQuery<ActivePrescription[]>
export type PatientPortalInvoicesQuery = PortalQuery<PortalInvoice[]>
export type PatientPortalLaboratoryQuery = PortalQuery<PortalLaboratoryResult[]>
