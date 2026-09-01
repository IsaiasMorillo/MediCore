import { apiRequest } from "@/lib/api/client"

import type {
  Appointment,
  CreateAppointmentInput,
  DoctorAvailability,
  RescheduleAppointmentInput,
} from "@/features/appointments/types"

export interface CreatedAppointmentResponse {
  id: string
}

export const appointmentKeys = {
  all: () => ["appointments"] as const,
  detail: (id: string) => ["appointments", "detail", id] as const,
  availability: () => ["appointments", "availability"] as const,
  doctorAvailability: (doctorId: string, date: string) => [
    "appointments",
    "availability",
    "doctor",
    doctorId,
    date,
  ] as const,
  globalAvailability: (date: string) => ["appointments", "availability", "global", date] as const,
}

export function getAppointment(id: string) {
  return apiRequest<Appointment>(`/api/appointments/${encodeURIComponent(id)}`)
}

export function getDoctorAvailability(doctorId: string, date: string) {
  const query = new URLSearchParams({ date })
  return apiRequest<DoctorAvailability>(
    `/api/appointments/availability/${encodeURIComponent(doctorId)}?${query.toString()}`
  )
}

export function getGlobalAvailability(date: string) {
  const query = new URLSearchParams({ date })
  return apiRequest<DoctorAvailability[]>(`/api/appointments/availability?${query.toString()}`)
}

export function createAppointment(input: CreateAppointmentInput) {
  return apiRequest<CreatedAppointmentResponse>("/api/appointments", {
    body: JSON.stringify(input),
    method: "POST",
  })
}

export function rescheduleAppointment(id: string, input: RescheduleAppointmentInput) {
  return apiRequest<void>(`/api/appointments/${encodeURIComponent(id)}/reschedule`, {
    body: JSON.stringify(input),
    method: "PUT",
  })
}

export function confirmAppointment(id: string) {
  return apiRequest<void>(`/api/appointments/${encodeURIComponent(id)}/confirm`, {
    method: "POST",
  })
}

export function cancelAppointment(id: string) {
  return apiRequest<void>(`/api/appointments/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
  })
}
