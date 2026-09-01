import { apiRequest } from "@/lib/api/client"

import type {
  CreateMedicalRecordInput,
  MedicalRecord,
  PatientClinicalHistoryResult,
} from "@/features/medical-records/types"

export interface CreatedMedicalRecordResponse {
  id: string
}

export const medicalRecordKeys = {
  all: () => ["medical-records"] as const,
  search: (term: string) => ["medical-records", "search", term] as const,
  detail: (id: string) => ["medical-records", "detail", id] as const,
  patient: (patientId: string) => ["medical-records", "patient", patientId] as const,
}

export function searchClinicalHistory(term: string) {
  const query = new URLSearchParams({ term: term.trim() })
  return apiRequest<PatientClinicalHistoryResult[]>(`/api/medical-records/search?${query.toString()}`)
}

export function getMedicalRecord(id: string) {
  return apiRequest<MedicalRecord>(`/api/medical-records/${encodeURIComponent(id)}`)
}

export function getPatientMedicalRecords(patientId: string) {
  return apiRequest<MedicalRecord[]>(`/api/medical-records/patient/${encodeURIComponent(patientId)}`)
}

export function createMedicalRecord(input: CreateMedicalRecordInput) {
  return apiRequest<CreatedMedicalRecordResponse>("/api/medical-records", {
    body: JSON.stringify(input),
    method: "POST",
  })
}
