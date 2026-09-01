import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createMedicalRecord,
  getMedicalRecord,
  getPatientMedicalRecords,
  medicalRecordKeys,
  searchClinicalHistory,
} from "@/features/medical-records/api/medical-records-api"
import type { CreateMedicalRecordInput } from "@/features/medical-records/types"

export function useClinicalHistorySearch(term: string) {
  const normalizedTerm = term.trim()

  return useQuery({
    enabled: Boolean(normalizedTerm),
    placeholderData: (previousData) => previousData,
    queryFn: () => searchClinicalHistory(normalizedTerm),
    queryKey: medicalRecordKeys.search(normalizedTerm),
  })
}

export function useMedicalRecord(id: string | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryFn: () => getMedicalRecord(id!),
    queryKey: medicalRecordKeys.detail(id ?? "missing"),
  })
}

export function usePatientMedicalRecords(patientId: string | undefined) {
  return useQuery({
    enabled: Boolean(patientId),
    queryFn: () => getPatientMedicalRecords(patientId!),
    queryKey: medicalRecordKeys.patient(patientId ?? "missing"),
  })
}

export function useCreateMedicalRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateMedicalRecordInput) => createMedicalRecord(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: medicalRecordKeys.all() })
    },
  })
}
