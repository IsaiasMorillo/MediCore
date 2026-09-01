import type { PatientClinicalHistory } from "@/features/patients/types"

export interface VitalSigns {
  bloodPressure: string
  heartRate: number | null
  temperature: number | null
  weightKg: number | null
}

export interface MedicalRecord {
  id: string
  patientId: string
  doctorId: string
  appointmentId: string | null
  consultationDate: string
  vitalSigns: VitalSigns
  diagnosis: string
  observations: string
  treatmentPlan: string
  prescriptionIds: string[]
  laboratoryOrderIds: string[]
}

export interface PatientClinicalHistoryResult {
  patientId: string
  patientName: string
  documentId: string
  clinicalHistory: PatientClinicalHistory
  medicalRecords: MedicalRecord[]
}

export interface CreateMedicalRecordInput {
  patientId: string
  doctorId: string
  appointmentId: string | null
  vitalSigns: VitalSigns
  diagnosis: string
  observations: string
  treatmentPlan: string
}
