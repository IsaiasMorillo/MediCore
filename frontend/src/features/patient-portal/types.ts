import type { AppointmentStatus } from "@/features/appointments/types"
import type { Invoice } from "@/features/billing/types"
import type { LaboratoryOrder } from "@/features/laboratory/types"

export interface UpcomingAppointment {
  id: string
  doctorId: string
  doctorName: string
  specialty: string
  startDateTime: string
  endDateTime: string
  status: AppointmentStatus
  notes: string
}

export interface ActivePrescription {
  id: string
  doctorId: string
  doctorName: string
  medicationId: string
  medicationName: string
  dosage: string
  frequency: string
  quantity: number
  instructions: string
  createdAt: string
}

export type PortalInvoice = Invoice
export type PortalLaboratoryResult = LaboratoryOrder

export type PortalSection =
  | "overview"
  | "appointments"
  | "prescriptions"
  | "invoices"
  | "laboratory-results"
