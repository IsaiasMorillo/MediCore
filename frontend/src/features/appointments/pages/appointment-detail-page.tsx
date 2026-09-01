import { Activity, ArrowLeft, CalendarClock, Check, Clock3, FileText, ShieldCheck, Trash2, UserRound } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Link, useParams } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert, SuccessAlert } from "@/features/auth/components/form-controls"
import { AppointmentStatusBadge } from "@/features/appointments/components/appointment-status-badge"
import {
  useAppointment,
  useCancelAppointment,
  useConfirmAppointment,
  useDoctorAvailability,
  useRescheduleAppointment,
} from "@/features/appointments/hooks/use-appointments"
import type { Appointment, AppointmentStatus } from "@/features/appointments/types"
import { getAppointmentErrorMessage } from "@/features/appointments/utils/appointment-errors"
import {
  formatAppointmentDateTime,
  formatAppointmentSlot,
  getDateInputValue,
  toDateInputValue,
  toTimeInputValue,
  toUtcDateTime,
} from "@/features/appointments/utils/appointment-formatting"
import { useDoctor } from "@/features/doctors/hooks/use-doctors"
import { formatDoctorName } from "@/features/doctors/utils/doctor-formatting"
import { usePatient } from "@/features/patients/hooks/use-patients"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"
import { hasAnyRole } from "@/lib/permissions/roles"
import { APPOINTMENT_WRITE_ROLES, CLINICAL_ROLES, NURSING_WRITE_ROLES } from "@/lib/permissions/route-roles"
import { useAuthSession } from "@/lib/auth/use-auth-session"

const EMPTY_SLOTS: readonly string[] = []

export function AppointmentDetailPage() {
  const { session } = useAuthSession()
  const { appointmentId } = useParams()
  const canManage = session ? hasAnyRole(session.user.roles, APPOINTMENT_WRITE_ROLES) : false
  const canCreateMedicalRecord = session ? hasAnyRole(session.user.roles, CLINICAL_ROLES) : false
  const canCreateVitals = session ? hasAnyRole(session.user.roles, NURSING_WRITE_ROLES) : false
  const appointmentQuery = useAppointment(appointmentId)
  const appointment = appointmentQuery.data
  const patientQuery = usePatient(appointment?.patientId)
  const doctorQuery = useDoctor(appointment?.doctorId)
  const confirmMutation = useConfirmAppointment()
  const cancelMutation = useCancelAppointment()
  const rescheduleMutation = useRescheduleAppointment()
  const [isCancelConfirmationOpen, setIsCancelConfirmationOpen] = useState(false)
  const [rescheduleSelection, setRescheduleSelection] = useState({ appointmentId: "", date: "", time: "" })
  const hasCurrentRescheduleSelection = Boolean(appointment && rescheduleSelection.appointmentId === appointment.id)
  const rescheduleDate = hasCurrentRescheduleSelection
    ? rescheduleSelection.date
    : appointment
      ? toDateInputValue(appointment.startDateTime)
      : ""
  const rescheduleTime = hasCurrentRescheduleSelection ? rescheduleSelection.time : ""

  const canReschedule = canManage && appointment ? isReschedulableStatus(appointment.status) : false
  const canConfirm = canManage && appointment ? appointment.status === "Scheduled" || appointment.status === "Rescheduled" : false
  const canCancel = canManage && appointment ? appointment.status !== "Cancelled" && appointment.status !== "Completed" : false
  const availabilityQuery = useDoctorAvailability(appointment?.doctorId ?? "", rescheduleDate, canReschedule)
  const isActionPending = confirmMutation.isPending || cancelMutation.isPending || rescheduleMutation.isPending

  if (!appointmentId) {
    return <AppointmentDetailState message="La consulta no tiene un identificador válido." />
  }

  if (appointmentQuery.isPending) {
    return <AppointmentDetailLoadingState />
  }

  if (appointmentQuery.isError || !appointment) {
    return (
      <AppointmentDetailState
        message={getAppointmentErrorMessage(appointmentQuery.error, "No pudimos cargar la cita solicitada.")}
        onRetry={() => void appointmentQuery.refetch()}
      />
    )
  }

  const patientName = patientQuery.data ? formatPatientName(patientQuery.data) : appointment.patientId
  const doctorName = doctorQuery.data ? formatDoctorName(doctorQuery.data) : appointment.doctorId

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync(appointment.id)
    } catch {
      // The mutation state renders the server response in the action panel.
    }
  }

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(appointment.id)
      setIsCancelConfirmationOpen(false)
    } catch {
      // Keep the confirmation visible so the user can retry or dismiss it.
    }
  }

  const handleReschedule = async () => {
    if (!rescheduleTime) {
      return
    }

    try {
      await rescheduleMutation.mutateAsync({
        id: appointment.id,
        input: { newStartDateTime: toUtcDateTime(rescheduleDate, rescheduleTime) },
      })
      setRescheduleSelection({ appointmentId: "", date: "", time: "" })
    } catch {
      // The mutation state renders the server response in the action panel.
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
        actions={
          <>
            <AppointmentStatusBadge status={appointment.status} />
            {canCreateMedicalRecord ? (
              <Link
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-3.5 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink"
                to={`/app/medical-records/new?appointmentId=${encodeURIComponent(appointment.id)}&patientId=${encodeURIComponent(appointment.patientId)}&doctorId=${encodeURIComponent(appointment.doctorId)}`}
              >
                <FileText aria-hidden="true" className="h-3.5 w-3.5" />
                Registrar expediente
              </Link>
            ) : null}
            {canCreateVitals ? (
              <Link
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-3.5 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink"
                to={`/app/nursing/vitals/new?appointmentId=${encodeURIComponent(appointment.id)}&patientId=${encodeURIComponent(appointment.patientId)}`}
              >
                <Activity aria-hidden="true" className="h-3.5 w-3.5" />
                Registrar signos
              </Link>
            ) : null}
          </>
        }
        description={`Registrada con el identificador ${appointment.id}. Consulta los participantes y gestiona su estado operativo.`}
        eyebrow="Atención · Ficha de cita"
        title="Detalle de la cita"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)]">
        <AppointmentOverview appointment={appointment} doctorName={doctorName} patientName={patientName} />
        <AppointmentActions
          availabilityQuery={availabilityQuery}
          canCancel={canCancel}
          canConfirm={canConfirm}
          canManage={canManage}
          canReschedule={canReschedule}
          cancelConfirmationOpen={isCancelConfirmationOpen}
          cancelMutation={cancelMutation}
          confirmMutation={confirmMutation}
          isActionPending={isActionPending}
          onCancel={() => void handleCancel()}
          onCloseCancel={() => setIsCancelConfirmationOpen(false)}
          onConfirm={() => void handleConfirm()}
          onOpenCancel={() => {
            cancelMutation.reset()
            setIsCancelConfirmationOpen(true)
          }}
          onReschedule={() => void handleReschedule()}
          rescheduleDate={rescheduleDate}
          rescheduleMutation={rescheduleMutation}
          rescheduleTime={rescheduleTime}
          setRescheduleDate={(date) => setRescheduleSelection({ appointmentId: appointment.id, date, time: "" })}
          setRescheduleTime={(time) => setRescheduleSelection({ appointmentId: appointment.id, date: rescheduleDate, time })}
        />
      </div>
    </div>
  )
}

function AppointmentOverview({
  appointment,
  doctorName,
  patientName,
}: {
  appointment: Appointment
  doctorName: string
  patientName: string
}) {
  return (
    <section className="space-y-5 rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Resumen operativo</p>
        <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink">Información de la atención</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard icon={<UserRound aria-hidden="true" className="h-4 w-4" />} label="Paciente" value={patientName} secondary={`ID ${appointment.patientId}`} />
        <InfoCard icon={<ShieldCheck aria-hidden="true" className="h-4 w-4" />} label="Médico" value={doctorName} secondary={`ID ${appointment.doctorId}`} />
        <InfoCard icon={<CalendarClock aria-hidden="true" className="h-4 w-4" />} label="Fecha y hora" value={formatAppointmentDateTime(appointment.startDateTime)} secondary="Zona operativa UTC" />
        <InfoCard icon={<Clock3 aria-hidden="true" className="h-4 w-4" />} label="Duración" value={`${appointment.durationMinutes} minutos`} secondary="Tiempo reservado" />
      </div>

      <div className="border-t border-line/70 pt-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink">
          <FileText aria-hidden="true" className="h-4 w-4 text-brand-strong" />
          Notas registradas
        </div>
        <p className="mt-3 rounded-xl bg-canvas/60 px-3.5 py-3 text-sm leading-6 text-ink-muted">
          {appointment.notes || "No se registraron notas para esta cita."}
        </p>
      </div>

      <p className="border-t border-line/70 pt-4 font-mono text-[0.68rem] text-ink-subtle">
        ID de cita: {appointment.id}
      </p>
    </section>
  )
}

function InfoCard({
  icon,
  label,
  secondary,
  value,
}: {
  icon: ReactNode
  label: string
  secondary: string
  value: string
}) {
  return (
    <article className="rounded-2xl border border-line/70 bg-canvas/45 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">{icon}</span>
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">{label}</p>
          <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
          <p className="mt-1 truncate font-mono text-[0.68rem] text-ink-subtle">{secondary}</p>
        </div>
      </div>
    </article>
  )
}

function AppointmentActions({
  availabilityQuery,
  canCancel,
  canConfirm,
  canManage,
  canReschedule,
  cancelConfirmationOpen,
  cancelMutation,
  confirmMutation,
  isActionPending,
  onCancel,
  onCloseCancel,
  onConfirm,
  onOpenCancel,
  onReschedule,
  rescheduleDate,
  rescheduleMutation,
  rescheduleTime,
  setRescheduleDate,
  setRescheduleTime,
}: {
  availabilityQuery: ReturnType<typeof useDoctorAvailability>
  canCancel: boolean
  canConfirm: boolean
  canManage: boolean
  canReschedule: boolean
  cancelConfirmationOpen: boolean
  cancelMutation: ReturnType<typeof useCancelAppointment>
  confirmMutation: ReturnType<typeof useConfirmAppointment>
  isActionPending: boolean
  onCancel: () => void
  onCloseCancel: () => void
  onConfirm: () => void
  onOpenCancel: () => void
  onReschedule: () => void
  rescheduleDate: string
  rescheduleMutation: ReturnType<typeof useRescheduleAppointment>
  rescheduleTime: string
  setRescheduleDate: (value: string) => void
  setRescheduleTime: (value: string) => void
}) {
  const freeSlots = availabilityQuery.data?.freeSlots ?? EMPTY_SLOTS

  return (
    <section className="h-fit space-y-5 rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
          <ShieldCheck aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Control de agenda</p>
          <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink">Acciones de la cita</h2>
        </div>
      </div>

      {!canManage ? (
        <p className="rounded-xl bg-canvas/60 px-3.5 py-3 text-xs leading-5 text-ink-muted">
          Tu rol puede consultar esta cita, pero no modificar su estado.
        </p>
      ) : null}

      {confirmMutation.isError ? <FormAlert message={getAppointmentErrorMessage(confirmMutation.error, "No pudimos confirmar la cita.")} /> : null}
      {cancelMutation.isError ? <FormAlert message={getAppointmentErrorMessage(cancelMutation.error, "No pudimos cancelar la cita.")} /> : null}
      {rescheduleMutation.isError ? <FormAlert message={getAppointmentErrorMessage(rescheduleMutation.error, "No pudimos reprogramar la cita.")} /> : null}
      {confirmMutation.isSuccess ? <SuccessAlert message="La cita fue confirmada." /> : null}
      {cancelMutation.isSuccess ? <SuccessAlert message="La cita fue cancelada." /> : null}
      {rescheduleMutation.isSuccess ? <SuccessAlert message="La cita fue reprogramada." /> : null}

      {canConfirm ? (
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong disabled:cursor-wait disabled:opacity-60"
          disabled={isActionPending}
          onClick={onConfirm}
          type="button"
        >
          <Check aria-hidden="true" className="h-4 w-4" />
          {confirmMutation.isPending ? "Confirmando..." : "Confirmar cita"}
        </button>
      ) : null}

      {canReschedule ? (
        <div className="border-t border-line/70 pt-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <CalendarClock aria-hidden="true" className="h-4 w-4 text-brand-strong" />
            Reprogramar
          </div>
          <p className="mt-1 text-xs leading-5 text-ink-muted">El nuevo horario conserva la duración actual de la cita.</p>
          <label className="mt-4 block text-xs font-semibold text-ink" htmlFor="reschedule-date">Nueva fecha</label>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
            id="reschedule-date"
            min={getDateInputValue()}
            onChange={(event) => {
              setRescheduleDate(event.target.value)
              setRescheduleTime("")
            }}
            type="date"
            value={rescheduleDate}
          />
          <div className="mt-4 flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
            <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
            Horarios libres
          </div>
          {availabilityQuery.isPending ? <MiniSlotLoadingState /> : null}
          {availabilityQuery.isError ? (
            <div className="mt-3">
              <FormAlert message={getAppointmentErrorMessage(availabilityQuery.error, "No pudimos consultar los nuevos horarios.")} />
            </div>
          ) : null}
          {!availabilityQuery.isPending && !availabilityQuery.isError && freeSlots.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-line px-3 py-3 text-xs leading-5 text-ink-muted">
              No hay slots libres para esta fecha.
            </p>
          ) : null}
          {!availabilityQuery.isPending && !availabilityQuery.isError && freeSlots.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {freeSlots.map((slot) => {
                const time = toTimeInputValue(slot)
                const isSelected = time === rescheduleTime

                return (
                  <button
                    aria-pressed={isSelected}
                    className={isSelected
                      ? "min-h-10 rounded-xl border border-brand bg-brand px-2 py-2 text-xs font-semibold text-white"
                      : "min-h-10 rounded-xl border border-line bg-panel-raised px-2 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-brand-strong"}
                    key={slot}
                    onClick={() => setRescheduleTime(time)}
                    type="button"
                  >
                    {formatAppointmentSlot(slot)}
                  </button>
                )
              })}
            </div>
          ) : null}
          {rescheduleTime ? (
            <p className="mt-3 text-xs text-ink-muted">Nuevo horario seleccionado: <strong className="text-ink">{rescheduleTime}</strong></p>
          ) : null}
          <button
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand-soft px-4 text-xs font-semibold text-brand-strong transition-colors hover:border-brand/50 hover:bg-brand-soft disabled:cursor-wait disabled:opacity-60"
            disabled={!rescheduleTime || isActionPending}
            onClick={onReschedule}
            type="button"
          >
            <CalendarClock aria-hidden="true" className="h-4 w-4" />
            {rescheduleMutation.isPending ? "Guardando nuevo horario..." : "Guardar reprogramación"}
          </button>
        </div>
      ) : null}

      {canCancel ? (
        <div className="border-t border-line/70 pt-5">
          {!cancelConfirmationOpen ? (
            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose/25 bg-rose-soft/55 px-4 text-xs font-semibold text-rose-strong transition-colors hover:border-rose/45 hover:bg-rose-soft disabled:cursor-wait disabled:opacity-60"
              disabled={isActionPending}
              onClick={onOpenCancel}
              type="button"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Cancelar cita
            </button>
          ) : (
            <div aria-describedby="cancel-appointment-description" aria-labelledby="cancel-appointment-title" className="rounded-2xl border border-rose/25 bg-rose-soft/55 p-4" role="alertdialog">
              <h3 className="text-sm font-semibold text-ink" id="cancel-appointment-title">¿Cancelar esta cita?</h3>
              <p className="mt-1 text-xs leading-5 text-ink-muted" id="cancel-appointment-description">
                El horario dejará de estar reservado y la cita quedará marcada como cancelada.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded-xl border border-line bg-panel-raised px-3.5 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" onClick={onCloseCancel} type="button">
                  No cancelar
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-rose-strong px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose disabled:cursor-wait disabled:opacity-60" disabled={cancelMutation.isPending} onClick={onCancel} type="button">
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                  {cancelMutation.isPending ? "Cancelando..." : "Sí, cancelar"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {!canConfirm && !canReschedule && !canCancel && canManage ? (
        <p className="rounded-xl bg-canvas/60 px-3.5 py-3 text-xs leading-5 text-ink-muted">
          Esta cita no tiene acciones pendientes para su estado actual.
        </p>
      ) : null}
    </section>
  )
}

function MiniSlotLoadingState() {
  return (
    <div aria-busy="true" className="mt-3 grid grid-cols-2 gap-2">
      {[0, 1, 2, 3].map((slot) => <span className="h-10 animate-pulse rounded-xl bg-line/60" key={slot} />)}
    </div>
  )
}

function isReschedulableStatus(status: AppointmentStatus) {
  return status !== "Cancelled" && status !== "Completed"
}

function AppointmentDetailLoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="block h-4 w-32 animate-pulse rounded-full bg-line/60" />
      <div className="space-y-3">
        <span className="block h-3 w-32 animate-pulse rounded-full bg-line/60" />
        <span className="block h-10 w-2/3 animate-pulse rounded-xl bg-line/60" />
        <span className="block h-4 w-full max-w-xl animate-pulse rounded-full bg-line/60" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)]">
        <div className="h-96 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" />
        <div className="h-72 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" />
      </div>
    </div>
  )
}

function AppointmentDetailState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center" role={onRetry ? "alert" : undefined}>
      <p className="text-sm font-semibold text-ink">No pudimos mostrar la cita</p>
      <p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {onRetry ? (
          <button className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button">
            Intentar nuevamente
          </button>
        ) : null}
        <Link className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to="/app/appointments">
          Volver a citas
        </Link>
      </div>
    </div>
  )
}
