import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  adjustMedicationStock,
  createMedication,
  createPrescription,
  dispensePrescription,
  getMedications,
  getPatientPrescriptions,
  pharmacyKeys,
  updateMedication,
} from "@/features/pharmacy/api/pharmacy-api"
import type {
  AdjustStockInput,
  CreateMedicationInput,
  CreatePrescriptionInput,
  DispensePrescriptionInput,
  UpdateMedicationInput,
} from "@/features/pharmacy/types"

export function useMedications(searchTerm = "") {
  const normalizedSearch = searchTerm.trim()

  return useQuery({
    placeholderData: (previousData) => previousData,
    queryFn: () => getMedications(normalizedSearch),
    queryKey: pharmacyKeys.medications(normalizedSearch),
  })
}

export function usePatientPrescriptions(patientId: string | undefined) {
  return useQuery({
    enabled: Boolean(patientId),
    placeholderData: (previousData) => previousData,
    queryFn: () => getPatientPrescriptions(patientId!),
    queryKey: pharmacyKeys.patientPrescriptions(patientId ?? "missing"),
  })
}

export function useCreateMedication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateMedicationInput) => createMedication(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pharmacyKeys.medicationLists() })
    },
  })
}

export function useUpdateMedication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMedicationInput }) => updateMedication(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pharmacyKeys.medicationLists() })
    },
  })
}

export function useAdjustMedicationStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AdjustStockInput) => adjustMedicationStock(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pharmacyKeys.medicationLists() })
    },
  })
}

export function useCreatePrescription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePrescriptionInput) => createPrescription(input),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: pharmacyKeys.patientPrescriptions(variables.patientId) })
    },
  })
}

export function useDispensePrescription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DispensePrescriptionInput) => dispensePrescription(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pharmacyKeys.medicationLists() }),
        queryClient.invalidateQueries({ queryKey: pharmacyKeys.prescriptions() }),
      ])
    },
  })
}
