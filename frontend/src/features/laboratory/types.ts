export const LABORATORY_TEST_TYPES = [
  "Hemograma",
  "Orina",
  "Radiografia",
  "Resonancia",
  "Tac",
  "Ecografia",
] as const

export type LaboratoryTestType = (typeof LABORATORY_TEST_TYPES)[number]
export type LaboratoryOrderStatus = "SolicitudPendiente" | "ResultadoCargado" | string

export interface LaboratoryTestTypesResponse {
  supported: string[]
  templates: string[]
}

export interface LaboratoryOrder {
  id: string
  patientId: string
  doctorId: string
  medicalRecordId: string | null
  testType: LaboratoryTestType | string
  status: LaboratoryOrderStatus
  requestedAt: string
  results: Record<string, unknown> | null
  resultsLoadedAt: string | null
}

export interface CreateLaboratoryOrderInput {
  patientId: string
  doctorId: string
  medicalRecordId: string | null
  testType: string
}

export interface LoadLaboratoryResultsInput {
  id: string
  results: Record<string, unknown>
}
