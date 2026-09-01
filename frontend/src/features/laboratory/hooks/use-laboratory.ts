import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createLaboratoryOrder,
  getLaboratoryOrder,
  getLaboratoryTestTypes,
  getPatientLaboratoryOrders,
  laboratoryKeys,
  loadLaboratoryResults,
} from "@/features/laboratory/api/laboratory-api"
import type { CreateLaboratoryOrderInput, LoadLaboratoryResultsInput } from "@/features/laboratory/types"

export function useLaboratoryTestTypes() {
  return useQuery({
    queryFn: getLaboratoryTestTypes,
    queryKey: laboratoryKeys.testTypes(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useLaboratoryOrder(orderId: string | undefined) {
  return useQuery({
    enabled: Boolean(orderId),
    queryFn: () => getLaboratoryOrder(orderId!),
    queryKey: laboratoryKeys.order(orderId ?? "missing"),
  })
}

export function usePatientLaboratoryOrders(patientId: string | undefined) {
  return useQuery({
    enabled: Boolean(patientId),
    placeholderData: (previousData) => previousData,
    queryFn: () => getPatientLaboratoryOrders(patientId!),
    queryKey: laboratoryKeys.patientOrders(patientId ?? "missing"),
  })
}

export function useCreateLaboratoryOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateLaboratoryOrderInput) => createLaboratoryOrder(input),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: laboratoryKeys.allOrders() }),
        queryClient.invalidateQueries({ queryKey: laboratoryKeys.patientOrders(variables.patientId) }),
      ])
    },
  })
}

export function useLoadLaboratoryResults() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LoadLaboratoryResultsInput) => loadLaboratoryResults(input),
    onSuccess: async (_, variables) => {
      const order = queryClient.getQueryData<{ patientId?: string }>(laboratoryKeys.order(variables.id))
      const patientInvalidation = order?.patientId
        ? queryClient.invalidateQueries({ queryKey: laboratoryKeys.patientOrders(order.patientId) })
        : Promise.resolve()

      await Promise.all([
        patientInvalidation,
        queryClient.invalidateQueries({ queryKey: laboratoryKeys.order(variables.id) }),
      ])
    },
  })
}
