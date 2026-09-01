import { apiRequest } from "@/lib/api/client"

import type { CreateVitalsRecordInput, VitalsRecord } from "@/features/nursing/types"

export interface CreatedVitalsRecordResponse {
  id: string
}

export const nursingKeys = {
  all: () => ["nursing"] as const,
  patientVitals: (patientId: string) => ["nursing", "vitals", "patient", patientId] as const,
}

export function getPatientVitals(patientId: string) {
  return apiRequest<VitalsRecord[]>(`/api/nursing/vitals/patient/${encodeURIComponent(patientId)}`)
}

export function createVitalsRecord(input: CreateVitalsRecordInput) {
  return apiRequest<CreatedVitalsRecordResponse>("/api/nursing/vitals", {
    body: JSON.stringify(input),
    method: "POST",
  })
}
