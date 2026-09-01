export type AppointmentStatus =
  | "Scheduled"
  | "Confirmed"
  | "Rescheduled"
  | "Cancelled"
  | "Completed"

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  startDateTime: string
  durationMinutes: number
  status: AppointmentStatus
  notes: string
}

export interface DoctorAvailability {
  doctorId: string
  doctorName: string
  specialty: string
  date: string
  freeSlots: string[]
}

export interface CreateAppointmentInput {
  patientId: string
  doctorId: string
  startDateTime: string
  durationMinutes: number
  notes: string
}

export interface RescheduleAppointmentInput {
  newStartDateTime: string
}
