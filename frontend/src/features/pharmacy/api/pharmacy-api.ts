import { apiRequest } from "@/lib/api/client"

import type {
  AdjustStockInput,
  CreateMedicationInput,
  CreatePrescriptionInput,
  DispensePrescriptionInput,
  Medication,
  Prescription,
  UpdateMedicationInput,
} from "@/features/pharmacy/types"

interface CreatedResourceResponse {
  id: string
}

export const pharmacyKeys = {
  all: () => ["pharmacy"] as const,
  medicationLists: () => ["pharmacy", "medications"] as const,
  medications: (searchTerm = "") => ["pharmacy", "medications", searchTerm] as const,
  prescriptions: () => ["pharmacy", "prescriptions"] as const,
  patientPrescriptions: (patientId: string) => ["pharmacy", "prescriptions", "patient", patientId] as const,
}

export function getMedications(searchTerm = "") {
  const normalizedSearch = searchTerm.trim()
  const query = normalizedSearch ? `?search=${encodeURIComponent(normalizedSearch)}` : ""

  return apiRequest<Medication[]>(`/api/pharmacy/medications${query}`)
}

export function createMedication(input: CreateMedicationInput) {
  return apiRequest<CreatedResourceResponse>("/api/pharmacy/medications", {
    body: JSON.stringify(input),
    method: "POST",
  })
}

export function updateMedication(id: string, input: UpdateMedicationInput) {
  return apiRequest<void>(`/api/pharmacy/medications/${encodeURIComponent(id)}`, {
    body: JSON.stringify(input),
    method: "PUT",
  })
}

export function adjustMedicationStock({ id, quantityChange }: AdjustStockInput) {
  return apiRequest<Medication>(`/api/pharmacy/medications/${encodeURIComponent(id)}/stock`, {
    body: JSON.stringify({ quantityChange }),
    method: "PATCH",
  })
}

export function createPrescription(input: CreatePrescriptionInput) {
  return apiRequest<CreatedResourceResponse>("/api/pharmacy/prescriptions", {
    body: JSON.stringify(input),
    method: "POST",
  })
}

export function getPatientPrescriptions(patientId: string) {
  return apiRequest<Prescription[]>(`/api/pharmacy/prescriptions/patient/${encodeURIComponent(patientId)}`)
}

export function dispensePrescription({ id, dispensedBy }: DispensePrescriptionInput) {
  return apiRequest<void>(`/api/pharmacy/prescriptions/${encodeURIComponent(id)}/dispense`, {
    body: JSON.stringify({ dispensedBy }),
    method: "POST",
  })
}
