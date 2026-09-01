import type { VitalSigns } from "@/features/medical-records/types"

export type { VitalSigns }

export interface VitalsRecord {
  id: string
  patientId: string
  appointmentId: string | null
  vitalSigns: VitalSigns
  notes: string
  recordedBy: string
  recordedAt: string
}

export interface CreateVitalsRecordInput {
  patientId: string
  appointmentId: string | null
  vitalSigns: VitalSigns
  notes: string
}
