import { ArrowUpRight, CalendarClock, Clock3 } from "lucide-react"
import { Link } from "react-router-dom"

import type { DoctorAvailability } from "@/features/appointments/types"
import {
  formatAppointmentSlot,
  toTimeInputValue,
} from "@/features/appointments/utils/appointment-formatting"

interface AvailabilityResultsProps {
  availability: readonly DoctorAvailability[]
  canBook: boolean
}

export function AvailabilityResults({ availability, canBook }: AvailabilityResultsProps) {
  if (availability.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
          <CalendarClock aria-hidden="true" className="h-5 w-5" />
        </span>
        <p className="mt-4 text-sm font-semibold text-ink">No hay disponibilidad registrada</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">
          Prueba con otra fecha o revisa la agenda de un médico específico.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {availability.map((doctorAvailability) => (
        <AvailabilityCard
          canBook={canBook}
          doctorAvailability={doctorAvailability}
          key={doctorAvailability.doctorId}
        />
      ))}
    </div>
  )
}

function AvailabilityCard({
  canBook,
  doctorAvailability,
}: {
  canBook: boolean
  doctorAvailability: DoctorAvailability
}) {
  const initials = doctorAvailability.doctorName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "M"

  return (
    <article className="rounded-[1.2rem] border border-line/80 bg-panel-raised p-4 shadow-[0_16px_40px_-32px_var(--ink)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-xs font-bold text-brand-strong">
            {initials}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-ink">{doctorAvailability.doctorName}</h3>
            <p className="mt-0.5 truncate text-xs text-ink-muted">{doctorAvailability.specialty}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-canvas px-2.5 py-1 text-[0.68rem] font-semibold text-ink-muted">
          {doctorAvailability.freeSlots.length} slot{doctorAvailability.freeSlots.length === 1 ? "" : "s"}
        </span>
      </div>

      {doctorAvailability.freeSlots.length > 0 ? (
        <div className="mt-5">
          <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
            <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
            Horarios disponibles
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {doctorAvailability.freeSlots.map((slot) => {
              const time = toTimeInputValue(slot)
              const slotLabel = formatAppointmentSlot(slot)

              return canBook ? (
                <Link
                  className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-brand/25 bg-brand-soft/65 px-2 py-2 text-xs font-semibold text-brand-strong transition-colors hover:border-brand/50 hover:bg-brand-soft"
                  key={slot}
                  to={`/app/appointments/new?doctorId=${encodeURIComponent(doctorAvailability.doctorId)}&date=${encodeURIComponent(doctorAvailability.date)}&start=${encodeURIComponent(time)}`}
                >
                  {slotLabel}
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  <span className="sr-only">, agendar</span>
                </Link>
              ) : (
                <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-line bg-canvas px-2 py-2 text-xs font-semibold text-ink-muted" key={slot}>
                  {slotLabel}
                </span>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-canvas px-3.5 py-3 text-xs leading-5 text-ink-muted">
          No hay slots libres para este médico en la fecha seleccionada.
        </p>
      )}
    </article>
  )
}

export function AvailabilityLoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="grid gap-4 lg:grid-cols-2">
      {[0, 1, 2, 3].map((card) => (
        <div className="h-48 animate-pulse rounded-[1.2rem] border border-line/70 bg-panel" key={card} />
      ))}
    </div>
  )
}
