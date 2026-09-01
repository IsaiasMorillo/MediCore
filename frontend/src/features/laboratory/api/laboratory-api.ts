import { apiRequest } from "@/lib/api/client"

import type {
  CreateLaboratoryOrderInput,
  LaboratoryOrder,
  LaboratoryTestTypesResponse,
  LoadLaboratoryResultsInput,
} from "@/features/laboratory/types"

export interface CreatedLaboratoryOrderResponse {
  id: string
}

export const laboratoryKeys = {
  allOrders: () => ["laboratory-orders"] as const,
  order: (orderId: string) => ["laboratory-order", orderId] as const,
  patientOrders: (patientId: string) => ["laboratory-orders", "patient", patientId] as const,
  testTypes: () => ["laboratory-test-types"] as const,
}

export function getLaboratoryTestTypes() {
  return apiRequest<LaboratoryTestTypesResponse>("/api/laboratory/test-types")
}

export function createLaboratoryOrder(input: CreateLaboratoryOrderInput) {
  return apiRequest<CreatedLaboratoryOrderResponse>("/api/laboratory/orders", {
    body: JSON.stringify(input),
    method: "POST",
  })
}

export function getLaboratoryOrder(orderId: string) {
  return apiRequest<LaboratoryOrder>(`/api/laboratory/orders/${encodeURIComponent(orderId)}`)
}

export function getPatientLaboratoryOrders(patientId: string) {
  return apiRequest<LaboratoryOrder[]>(`/api/laboratory/orders/patient/${encodeURIComponent(patientId)}`)
}

export function loadLaboratoryResults({ id, results }: LoadLaboratoryResultsInput) {
  return apiRequest<void>(`/api/laboratory/orders/${encodeURIComponent(id)}/results`, {
    body: JSON.stringify(results),
    method: "POST",
  })
}
