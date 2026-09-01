import { apiRequest } from "@/lib/api/client"

import type {
  CreatePatientInput,
  Patient,
  UpdatePatientInput,
} from "@/features/patients/types"

interface CreatedPatientResponse {
  id: string
}

export const patientKeys = {
  all: () => ["patients"] as const,
  lists: () => ["patients", "list"] as const,
  list: (searchTerm: string) => ["patients", "list", searchTerm] as const,
  detail: (id: string) => ["patients", "detail", id] as const,
}

export function searchPatients(searchTerm = "") {
  const normalizedSearch = searchTerm.trim()
  const query = normalizedSearch
    ? `?search=${encodeURIComponent(normalizedSearch)}`
    : ""

  return apiRequest<Patient[]>(`/api/patients${query}`)
}

export function getPatient(id: string) {
  return apiRequest<Patient>(`/api/patients/${encodeURIComponent(id)}`)
}

export function createPatient(input: CreatePatientInput) {
  return apiRequest<CreatedPatientResponse>("/api/patients", {
    body: JSON.stringify(input),
    method: "POST",
  })
}

export function updatePatient(id: string, input: UpdatePatientInput) {
  return apiRequest<void>(`/api/patients/${encodeURIComponent(id)}`, {
    body: JSON.stringify(input),
    method: "PUT",
  })
}

export function deletePatient(id: string) {
  return apiRequest<void>(`/api/patients/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}
