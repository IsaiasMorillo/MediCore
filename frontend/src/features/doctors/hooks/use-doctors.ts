import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createDoctor,
  deleteDoctor,
  doctorKeys,
  getDoctor,
  searchDoctors,
  updateDoctor,
} from "@/features/doctors/api/doctors-api"
import type {
  CreateDoctorInput,
  UpdateDoctorInput,
} from "@/features/doctors/types"

export function useDoctors(filters: { searchTerm?: string; specialty?: string } = {}) {
  const normalizedFilters = {
    searchTerm: filters.searchTerm?.trim() ?? "",
    specialty: filters.specialty?.trim() ?? "",
  }

  return useQuery({
    placeholderData: (previousData) => previousData,
    queryFn: () => searchDoctors(normalizedFilters),
    queryKey: doctorKeys.list(normalizedFilters),
  })
}

export function useDoctor(id: string | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryFn: () => getDoctor(id!),
    queryKey: doctorKeys.detail(id ?? "missing"),
  })
}

export function useCreateDoctor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateDoctorInput) => createDoctor(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: doctorKeys.all() })
    },
  })
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDoctorInput }) =>
      updateDoctor(id, input),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: doctorKeys.all() }),
        queryClient.invalidateQueries({ queryKey: doctorKeys.detail(variables.id) }),
      ])
    },
  })
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteDoctor(id),
    onSuccess: async (_, id) => {
      queryClient.removeQueries({ queryKey: doctorKeys.detail(id) })
      await queryClient.invalidateQueries({ queryKey: doctorKeys.all() })
    },
  })
}
