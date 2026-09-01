export interface Medication {
  id: string
  name: string
  code: string
  category: string
  stockQuantity: number
  price: number
  expirationDate: string | null
  reorderLevel: number
  isActive: boolean
}

export interface CreateMedicationInput {
  name: string
  code: string
  category: string
  stockQuantity: number
  price: number
  expirationDate: string | null
  reorderLevel: number
}

export interface UpdateMedicationInput extends CreateMedicationInput {
  isActive: boolean
}

export interface AdjustStockInput {
  id: string
  quantityChange: number
}

export type PrescriptionStatus = "Emitida" | "Despachada" | "Cancelada" | string

export interface Prescription {
  id: string
  patientId: string
  doctorId: string
  medicalRecordId: string | null
  medicationId: string
  medicationName: string
  dosage: string
  frequency: string
  quantity: number
  instructions: string
  status: PrescriptionStatus
  dispensedAt: string | null
  dispensedBy: string | null
}

export interface CreatePrescriptionInput {
  patientId: string
  doctorId: string
  medicalRecordId: string | null
  medicationId: string
  dosage: string
  frequency: string
  quantity: number
  instructions: string
}

export interface DispensePrescriptionInput {
  id: string
  dispensedBy: string | null
}
