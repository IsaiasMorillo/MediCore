import type { AppointmentStatus } from "@/features/appointments/types"
import { formatAppointmentStatus } from "@/features/appointments/utils/appointment-formatting"

const statusStyles: Record<AppointmentStatus, string> = {
  Cancelled: "border-rose/25 bg-rose-soft/70 text-rose-strong",
  Completed: "border-line bg-canvas text-ink-muted",
  Confirmed: "border-brand/25 bg-brand-soft text-brand-strong",
  Rescheduled: "border-indigo/25 bg-indigo-soft text-indigo",
  Scheduled: "border-amber/30 bg-amber-soft text-amber-strong",
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold ${statusStyles[status] ?? statusStyles.Scheduled}`}>
      {formatAppointmentStatus(status)}
    </span>
  )
}
