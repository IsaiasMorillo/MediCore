import { formatAppointmentTime } from "@/features/appointments/utils/appointment-formatting"
import type { Invoice } from "@/features/billing/types"
import type { UpcomingAppointment } from "@/features/patient-portal/types"

export function formatPortalAppointmentTimeRange(appointment: Pick<UpcomingAppointment, "startDateTime" | "endDateTime">) {
  const start = formatAppointmentTime(appointment.startDateTime)
  const end = formatAppointmentTime(appointment.endDateTime)

  return `${start} - ${end}`
}

export function getPortalFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "paciente"
}

export function countPendingPortalInvoices(invoices: readonly Invoice[]) {
  return invoices.filter((invoice) => invoice.status === "Pendiente" && invoice.balance > 0).length
}
