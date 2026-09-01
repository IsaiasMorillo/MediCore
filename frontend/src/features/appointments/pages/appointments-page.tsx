import { CalendarDays, ClipboardList, RefreshCw, Search, UsersRound } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert } from "@/features/auth/components/form-controls"
import { AvailabilityLoadingState, AvailabilityResults } from "@/features/appointments/components/availability-results"
import {
  useDoctorAvailability,
  useGlobalAvailability,
} from "@/features/appointments/hooks/use-appointments"
import { getAppointmentErrorMessage } from "@/features/appointments/utils/appointment-errors"
import { getDateInputValue } from "@/features/appointments/utils/appointment-formatting"
import { useDoctors as useDoctorsDirectory } from "@/features/doctors/hooks/use-doctors"
import { formatDoctorName } from "@/features/doctors/utils/doctor-formatting"
import { hasAnyRole } from "@/lib/permissions/roles"
import { APPOINTMENT_WRITE_ROLES } from "@/lib/permissions/route-roles"
import { useAuthSession } from "@/lib/auth/use-auth-session"

export function AppointmentsPage() {
  const { session } = useAuthSession()
  const navigate = useNavigate()
  const canManage = session ? hasAnyRole(session.user.roles, APPOINTMENT_WRITE_ROLES) : false
  const [date, setDate] = useState(getDateInputValue(1))
  const [doctorId, setDoctorId] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  const doctorsQuery = useDoctorsDirectory({})
  const globalAvailabilityQuery = useGlobalAvailability(date, canManage)
  const doctorAvailabilityQuery = useDoctorAvailability(doctorId, date, !canManage)
  const activeDoctors = (doctorsQuery.data ?? []).filter((doctor) => doctor.isActive)
  const availability = canManage
    ? globalAvailabilityQuery.data ?? []
    : doctorAvailabilityQuery.data
      ? [doctorAvailabilityQuery.data]
      : []
  const specialties = Array.from(new Set(availability.map((doctor) => doctor.specialty))).sort((first, second) => first.localeCompare(second, "es"))
  const visibleAvailability = specialtyFilter === "all"
    ? availability
    : availability.filter((doctor) => doctor.specialty === specialtyFilter)
  const availabilityQuery = canManage ? globalAvailabilityQuery : doctorAvailabilityQuery
  const isAvailabilityLoading = canManage
    ? globalAvailabilityQuery.isPending
    : Boolean(doctorId) && doctorAvailabilityQuery.isPending
  const totalSlots = visibleAvailability.reduce((total, doctor) => total + doctor.freeSlots.length, 0)

  return (
    <div className="space-y-7">
      <PageHeader
        actions={
          canManage ? (
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong"
              to="/app/appointments/new"
            >
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              Programar cita
            </Link>
          ) : null
        }
        description="Consulta los slots libres de la agenda médica y abre una cita existente con su identificador."
        eyebrow="Atención · Agenda clínica"
        title="Citas"
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <SummaryCard icon={<UsersRound aria-hidden="true" className="h-4 w-4" />} label="Médicos con agenda" value={visibleAvailability.length} />
        <SummaryCard icon={<CalendarDays aria-hidden="true" className="h-4 w-4" />} label="Slots libres" value={totalSlots} />
      </section>

      <section className="rounded-[1.35rem] border border-line/80 bg-panel p-4 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Explorar agenda</p>
            <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink">
              {canManage ? "Disponibilidad de la clínica" : "Disponibilidad por médico"}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-ink-muted">
              {canManage
                ? "Elige una fecha para comparar los horarios libres de todos los médicos activos."
                : "Elige una fecha y un médico para consultar sus horarios libres."}
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-[27rem]">
            <label>
              <span className="mb-2 block text-xs font-semibold text-ink">Fecha de consulta</span>
              <input
                aria-label="Fecha de consulta"
                className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
                min={getDateInputValue()}
                onChange={(event) => setDate(event.target.value)}
                type="date"
                value={date}
              />
            </label>
            {canManage ? (
              <label>
                <span className="mb-2 block text-xs font-semibold text-ink">Especialidad</span>
                <select
                  aria-label="Filtrar por especialidad"
                  className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
                  onChange={(event) => setSpecialtyFilter(event.target.value)}
                  value={specialtyFilter}
                >
                  <option value="all">Todas las especialidades</option>
                  {specialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
                </select>
              </label>
            ) : null}
          </div>
        </div>

        {!canManage ? (
          <div className="mt-4 max-w-xl">
            <label className="block text-xs font-semibold text-ink" htmlFor="appointment-doctor-lookup">Médico</label>
            <select
              className="mt-2 h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
              id="appointment-doctor-lookup"
              onChange={(event) => setDoctorId(event.target.value)}
              value={doctorId}
            >
              <option value="">Selecciona un médico</option>
              {activeDoctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {formatDoctorName(doctor)} · {doctor.specialty}
                </option>
              ))}
            </select>
            {doctorsQuery.isError ? (
              <div className="mt-3">
                <FormAlert message={getAppointmentErrorMessage(doctorsQuery.error, "No pudimos cargar los médicos.")} />
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section aria-labelledby="availability-results-title" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="availability-results-title">
              Horarios disponibles
            </h2>
            <p className="mt-1 text-xs text-ink-muted">Las horas corresponden a la zona operativa UTC configurada por MediCore.</p>
          </div>
          <span aria-live="polite" className="text-[0.68rem] text-ink-subtle">
            {availabilityQuery.isFetching ? "Actualizando disponibilidad..." : date ? `Fecha ${date}` : "Selecciona una fecha"}
          </span>
        </div>

        {isAvailabilityLoading || (!canManage && doctorsQuery.isPending) ? <AvailabilityLoadingState /> : null}
        {availabilityQuery.isError ? (
          <AvailabilityErrorState
            message={getAppointmentErrorMessage(availabilityQuery.error, "No pudimos consultar la disponibilidad.")}
            onRetry={() => void availabilityQuery.refetch()}
          />
        ) : null}
        {!isAvailabilityLoading && !availabilityQuery.isError && !canManage && !doctorId ? (
          <EmptyAvailabilityState
            description="Selecciona un médico para consultar sus slots libres en la fecha indicada."
            title="Elige un médico"
          />
        ) : null}
        {!isAvailabilityLoading && !availabilityQuery.isError && (canManage || Boolean(doctorId)) ? (
          <AvailabilityResults availability={visibleAvailability} canBook={canManage} />
        ) : null}
      </section>

      <AppointmentLookup onSubmit={(id) => navigate(`/app/appointments/${encodeURIComponent(id)}`)} />
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <article className="rounded-[1.2rem] border border-line/80 bg-panel p-4 shadow-[0_16px_40px_-32px_var(--ink)]">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">{icon}</span>
        <span className="font-display text-2xl font-semibold tracking-[-0.05em] text-ink">{value}</span>
      </div>
      <p className="mt-3 text-xs font-medium text-ink-muted">{label}</p>
    </article>
  )
}

function AppointmentLookup({ onSubmit }: { onSubmit: (id: string) => void }) {
  const [appointmentId, setAppointmentId] = useState("")
  const [error, setError] = useState<string | null>(null)

  return (
    <section className="rounded-[1.35rem] border border-line/80 bg-ink p-5 text-white shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-soft">
            <ClipboardList aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-[-0.035em]">Consultar una cita</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-white/60">
              El backend no expone un listado general. Abre una cita usando el ID que recibiste al programarla.
            </p>
          </div>
        </div>
        <form
          className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl"
          onSubmit={(event) => {
            event.preventDefault()
            const normalizedId = appointmentId.trim()

            if (!normalizedId) {
              setError("Ingresa el identificador de la cita.")
              return
            }

            setError(null)
            onSubmit(normalizedId)
          }}
        >
          <label className="sr-only" htmlFor="appointment-lookup-id">Identificador de la cita</label>
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              aria-describedby={error ? "appointment-lookup-error" : undefined}
              aria-invalid={Boolean(error)}
              className="h-11 w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-3.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand-soft/60 focus:ring-2 focus:ring-brand-soft/20"
              id="appointment-lookup-id"
              onChange={(event) => {
                setError(null)
                setAppointmentId(event.target.value)
              }}
              placeholder="Ej. 67f2..."
              value={appointmentId}
            />
          </div>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-soft px-4 text-xs font-semibold text-brand-strong transition-colors hover:bg-white" type="submit">
            <Search aria-hidden="true" className="h-4 w-4" />
            Abrir cita
          </button>
        </form>
      </div>
      {error ? <p className="mt-3 text-xs text-rose-soft" id="appointment-lookup-error" role="alert">{error}</p> : null}
    </section>
  )
}

function AvailabilityErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-rose/20 bg-rose-soft/45 px-6 py-10 text-center" role="alert">
      <p className="text-sm font-semibold text-ink">No pudimos cargar la disponibilidad</p>
      <p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p>
      <button
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong"
        onClick={onRetry}
        type="button"
      >
        <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
        Intentar nuevamente
      </button>
    </div>
  )
}

function EmptyAvailabilityState({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
        <CalendarDays aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">{description}</p>
    </div>
  )
}
