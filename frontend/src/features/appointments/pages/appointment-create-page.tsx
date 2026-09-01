import { ArrowLeft, CalendarDays, ShieldCheck } from "lucide-react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import type { SubmitHandler } from "react-hook-form"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert } from "@/features/auth/components/form-controls"
import { AppointmentForm } from "@/features/appointments/components/appointment-form"
import { useCreateAppointment } from "@/features/appointments/hooks/use-appointments"
import { getAppointmentErrorMessage } from "@/features/appointments/utils/appointment-errors"
import { toUtcDateTime } from "@/features/appointments/utils/appointment-formatting"
import { type AppointmentFormValues } from "@/features/appointments/schemas/appointment-schemas"
import { useDoctors } from "@/features/doctors/hooks/use-doctors"
import { usePatients } from "@/features/patients/hooks/use-patients"

export function AppointmentCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const patientsQuery = usePatients("")
  const doctorsQuery = useDoctors({})
  const createMutation = useCreateAppointment()
  const initialDoctorId = searchParams.get("doctorId") ?? undefined
  const initialDate = getValidDate(searchParams.get("date"))
  const initialStartTime = getValidTime(searchParams.get("start"))
  const hasResourceError = patientsQuery.isError || doctorsQuery.isError
  const isLoadingResources = patientsQuery.isPending || doctorsQuery.isPending

  const handleSubmit: SubmitHandler<AppointmentFormValues> = async (values) => {
    try {
      const result = await createMutation.mutateAsync({
        doctorId: values.doctorId,
        durationMinutes: values.durationMinutes,
        notes: values.notes,
        patientId: values.patientId,
        startDateTime: toUtcDateTime(values.appointmentDate, values.startTime),
      })

      navigate(`/app/appointments/${result.id}`, { replace: true })
    } catch {
      // The mutation state renders the server response below the page header.
    }
  }

  return (
    <div className="space-y-7">
      <Link
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none"
        to="/app/appointments"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Volver a citas
      </Link>
      <PageHeader
        description="Selecciona un paciente, un médico y un slot libre para registrar una nueva atención."
        eyebrow="Atención · Nueva cita"
        title="Programar cita"
      />

      {createMutation.isError ? (
        <FormAlert message={getAppointmentErrorMessage(createMutation.error, "No pudimos programar la cita.")} />
      ) : null}

      {isLoadingResources ? <AppointmentResourcesLoadingState /> : null}
      {hasResourceError ? (
        <AppointmentResourcesErrorState
          message={getAppointmentErrorMessage(
            patientsQuery.error ?? doctorsQuery.error,
            "No pudimos cargar los pacientes y médicos necesarios."
          )}
          onRetry={() => void Promise.all([patientsQuery.refetch(), doctorsQuery.refetch()])}
        />
      ) : null}
      {!isLoadingResources && !hasResourceError ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
            <AppointmentForm
              doctors={doctorsQuery.data ?? []}
              initialDate={initialDate}
              initialDoctorId={initialDoctorId}
              initialStartTime={initialStartTime}
              onSubmit={handleSubmit}
              patients={patientsQuery.data ?? []}
              serverError={null}
            />
          </section>
          <BookingGuidance />
        </div>
      ) : null}
    </div>
  )
}

function BookingGuidance() {
  return (
    <aside className="h-fit rounded-[1.35rem] border border-line/80 bg-ink p-5 text-white shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-brand-soft">
        <ShieldCheck aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-soft">Flujo seguro</p>
      <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em]">Antes de confirmar</h2>
      <ul className="mt-4 space-y-3 text-xs leading-5 text-white/65">
        <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-soft" />Verifica que el paciente esté activo.</li>
        <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-soft" />El slot se valida nuevamente al guardar.</li>
        <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-soft" />La cita se crea inicialmente como programada.</li>
      </ul>
      <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-[0.68rem] text-white/50">
        <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
        Las horas respetan la agenda operativa UTC.
      </div>
    </aside>
  )
}

function AppointmentResourcesLoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
      <div className="h-[34rem] animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" />
      <div className="h-72 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" />
    </div>
  )
}

function AppointmentResourcesErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[1.35rem] border border-rose/20 bg-rose-soft/45 px-6 py-12 text-center" role="alert">
      <p className="text-sm font-semibold text-ink">No pudimos preparar el formulario</p>
      <p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p>
      <button className="mt-5 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button">
        Intentar nuevamente
      </button>
    </div>
  )
}

function getValidDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}

function getValidTime(value: string | null) {
  return value && /^\d{2}:\d{2}$/.test(value) ? value : undefined
}
