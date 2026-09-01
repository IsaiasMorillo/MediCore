import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createVitalsRecord,
  getPatientVitals,
  nursingKeys,
} from "@/features/nursing/api/nursing-api"
import type { CreateVitalsRecordInput } from "@/features/nursing/types"

export function usePatientVitals(patientId: string | undefined) {
  return useQuery({
    enabled: Boolean(patientId),
    placeholderData: (previousData) => previousData,
    queryFn: () => getPatientVitals(patientId!),
    queryKey: nursingKeys.patientVitals(patientId ?? "missing"),
  })
}

export function useCreateVitalsRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateVitalsRecordInput) => createVitalsRecord(input),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: nursingKeys.patientVitals(variables.patientId) })
    },
  })
}
