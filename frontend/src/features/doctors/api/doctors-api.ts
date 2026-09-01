import { apiRequest } from "@/lib/api/client"

import type {
  CreateDoctorInput,
  Doctor,
  UpdateDoctorInput,
} from "@/features/doctors/types"

interface CreatedDoctorResponse {
  id: string
}

export interface DoctorSearchFilters {
  searchTerm?: string
  specialty?: string
}

export const doctorKeys = {
  all: () => ["doctors"] as const,
  detail: (id: string) => ["doctors", "detail", id] as const,
  list: (filters: DoctorSearchFilters) => ["doctors", "list", filters.searchTerm ?? "", filters.specialty ?? ""] as const,
}

export function searchDoctors({ searchTerm = "", specialty = "" }: DoctorSearchFilters = {}) {
  const params = new URLSearchParams()
  const normalizedSearch = searchTerm.trim()
  const normalizedSpecialty = specialty.trim()

  if (normalizedSpecialty) {
    params.set("specialty", normalizedSpecialty)
  }

  if (normalizedSearch) {
    params.set("search", normalizedSearch)
  }

  const query = params.toString()

  return apiRequest<Doctor[]>(`/api/doctors${query ? `?${query}` : ""}`)
}

export function getDoctor(id: string) {
  return apiRequest<Doctor>(`/api/doctors/${encodeURIComponent(id)}`)
}

export function createDoctor(input: CreateDoctorInput) {
  return apiRequest<CreatedDoctorResponse>("/api/doctors", {
    body: JSON.stringify(input),
    method: "POST",
  })
}

export function updateDoctor(id: string, input: UpdateDoctorInput) {
  return apiRequest<void>(`/api/doctors/${encodeURIComponent(id)}`, {
    body: JSON.stringify(input),
    method: "PUT",
  })
}

export function deleteDoctor(id: string) {
  return apiRequest<void>(`/api/doctors/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}
