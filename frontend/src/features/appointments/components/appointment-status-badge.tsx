import type { AppointmentStatus } from "@/features/appointments/types"
import { formatAppointmentStatus } from "@/features/appointments/utils/appointment-formatting"
import { StatusBadge, type StatusTone } from "@/components/ui"

const statusTones: Record<AppointmentStatus, StatusTone> = {
  Cancelled: "danger",
  Completed: "neutral",
  Confirmed: "success",
  Rescheduled: "info",
  Scheduled: "warning",
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <StatusBadge label={formatAppointmentStatus(status)} tone={statusTones[status] ?? "neutral"} />
}
