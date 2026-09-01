import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createPatient,
  deletePatient,
  getPatient,
  patientKeys,
  searchPatients,
  updatePatient,
} from "@/features/patients/api/patients-api"
import type {
  CreatePatientInput,
  UpdatePatientInput,
} from "@/features/patients/types"

export function usePatients(searchTerm: string) {
  return useQuery({
    placeholderData: (previousData) => previousData,
    queryFn: () => searchPatients(searchTerm),
    queryKey: patientKeys.list(searchTerm),
  })
}

export function usePatient(id: string | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryFn: () => getPatient(id!),
    queryKey: patientKeys.detail(id ?? "missing"),
  })
}

export function useCreatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePatientInput) => createPatient(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: patientKeys.all() })
    },
  })
}

export function useUpdatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePatientInput }) =>
      updatePatient(id, input),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: patientKeys.all() }),
        queryClient.invalidateQueries({ queryKey: patientKeys.detail(variables.id) }),
      ])
    },
  })
}

export function useDeletePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: async (_, id) => {
      queryClient.removeQueries({ queryKey: patientKeys.detail(id) })
      await queryClient.invalidateQueries({ queryKey: patientKeys.all() })
    },
  })
}
