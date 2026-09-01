import { zodResolver } from "@hookform/resolvers/zod"
import { Clock3, FileText, Search } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import {
  useForm,
  useWatch,
  type SubmitHandler,
  type UseFormRegisterReturn,
} from "react-hook-form"

import { FieldError, FormAlert, FormErrorSummary, FormSection, SubmitButton } from "@/features/auth/components/form-controls"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"
import { useDoctorAvailability } from "@/features/appointments/hooks/use-appointments"
import { appointmentFormSchema, type AppointmentFormValues } from "@/features/appointments/schemas/appointment-schemas"
import type { Doctor } from "@/features/doctors/types"
import { formatDoctorName } from "@/features/doctors/utils/doctor-formatting"
import type { Patient } from "@/features/patients/types"
import { formatPatientContact, formatPatientName } from "@/features/patients/utils/patient-formatting"
import { getAppointmentErrorMessage } from "@/features/appointments/utils/appointment-errors"
import { formatAppointmentSlot, getDateInputValue, toTimeInputValue } from "@/features/appointments/utils/appointment-formatting"

interface AppointmentFormProps {
  doctors: readonly Doctor[]
  initialDate?: string
  initialDoctorId?: string
  initialStartTime?: string
  onSubmit: SubmitHandler<AppointmentFormValues>
  patients: readonly Patient[]
  serverError?: string | null
}

const EMPTY_SLOTS: readonly string[] = []

export function AppointmentForm({
  doctors,
  initialDate,
  initialDoctorId,
  initialStartTime,
  onSubmit,
  patients,
  serverError,
}: AppointmentFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<AppointmentFormValues>({
    defaultValues: {
      appointmentDate: initialDate || getDateInputValue(1),
      doctorId: initialDoctorId ?? "",
      durationMinutes: 30,
      notes: "",
      patientId: "",
      startTime: initialStartTime ?? "",
    },
    mode: "onBlur",
    resolver: zodResolver(appointmentFormSchema),
    shouldFocusError: true,
  })
  const selectedDoctorId = useWatch({ control, name: "doctorId" }) ?? ""
  const selectedDate = useWatch({ control, name: "appointmentDate" }) ?? ""
  const selectedStartTime = useWatch({ control, name: "startTime" }) ?? ""
  const selectedPatientId = useWatch({ control, name: "patientId" }) ?? ""
  const availabilityQuery = useDoctorAvailability(selectedDoctorId, selectedDate)
  const activeDoctors = doctors.filter((doctor) => doctor.isActive)
  const activePatients = patients.filter((patient) => patient.isActive)
  const [patientSearch, setPatientSearch] = useState("")
  const validationMessages = getFormErrorMessages(errors)
  const freeSlots = availabilityQuery.data?.freeSlots ?? EMPTY_SLOTS
  const isAvailabilityRequested = Boolean(selectedDoctorId && selectedDate)
  const isAvailabilityLoading = isAvailabilityRequested && availabilityQuery.isPending
  const normalizedPatientSearch = patientSearch.trim().toLocaleLowerCase("es")
  const matchingPatients = activePatients.filter((patient) => {
    if (!normalizedPatientSearch) {
      return true
    }

    const searchableText = `${formatPatientName(patient)} ${patient.personalData.documentId}`.toLocaleLowerCase("es")
    return searchableText.includes(normalizedPatientSearch)
  })
  const selectedPatient = activePatients.find((patient) => patient.id === selectedPatientId)
  const patientOptions = selectedPatient && !matchingPatients.some((patient) => patient.id === selectedPatient.id)
    ? [selectedPatient, ...matchingPatients]
    : matchingPatients

  useEffect(() => {
    if (!availabilityQuery.data || !selectedStartTime) {
      return
    }

    const hasSelectedSlot = freeSlots.some((slot) => toTimeInputValue(slot) === selectedStartTime)

    if (!hasSelectedSlot) {
      setValue("startTime", "", { shouldValidate: true })
    }
  }, [availabilityQuery.data, freeSlots, selectedStartTime, setValue])

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormErrorSummary messages={validationMessages} />
      {serverError ? <FormAlert message={serverError} /> : null}

      <FormSection
        description="Relaciona la cita con las personas que participarán en la atención. Solo se muestran registros activos."
        title="Participantes"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-ink" htmlFor="appointment-patient-search">Buscar paciente</label>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input
                aria-label="Buscar paciente"
                className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
                id="appointment-patient-search"
                onChange={(event) => setPatientSearch(event.target.value)}
                placeholder="Nombre o documento"
                type="search"
                value={patientSearch}
              />
            </div>
            <AppointmentSelect
              error={errors.patientId?.message}
              id="appointment-patient"
              label="Paciente"
              registration={register("patientId")}
            >
              <option value="">Selecciona un paciente</option>
              {patientOptions.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {formatPatientName(patient)} · {formatPatientContact(patient)}
                </option>
              ))}
              {patientOptions.length === 0 ? <option disabled value="">No encontramos pacientes activos</option> : null}
            </AppointmentSelect>
          </div>
          <AppointmentSelect
            error={errors.doctorId?.message}
            id="appointment-doctor"
            label="Médico"
            registration={register("doctorId")}
          >
            <option value="">Selecciona un médico</option>
            {activeDoctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {formatDoctorName(doctor)} · {doctor.specialty}
              </option>
            ))}
          </AppointmentSelect>
        </div>
        {activePatients.length === 0 ? (
          <p className="text-xs leading-5 text-ink-muted">No hay pacientes activos disponibles para programar.</p>
        ) : null}
        {activeDoctors.length === 0 ? (
          <p className="text-xs leading-5 text-ink-muted">No hay médicos activos disponibles para programar.</p>
        ) : null}
      </FormSection>

      <FormSection
        description="La disponibilidad se consulta contra la agenda real del médico y excluye horarios ocupados."
        title="Horario de atención"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AppointmentInput
            error={errors.appointmentDate?.message}
            id="appointment-date"
            label="Fecha"
            min={getDateInputValue()}
            registration={register("appointmentDate")}
            type="date"
          />
          <AppointmentSelect
            error={errors.durationMinutes?.message}
            id="appointment-duration"
            label="Duración"
            registration={register("durationMinutes", { valueAsNumber: true })}
          >
            <option value="30">30 minutos</option>
            <option value="60">60 minutos</option>
            <option value="90">90 minutos</option>
          </AppointmentSelect>
        </div>

        <div className="rounded-2xl border border-line/80 bg-canvas/45 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
              <Clock3 aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">Selecciona un slot libre</h3>
              <p className="mt-1 text-xs leading-5 text-ink-muted">
                Las horas se muestran en la zona operativa UTC configurada por MediCore.
              </p>
            </div>
          </div>

          <input {...register("startTime")} type="hidden" />
          {!selectedDoctorId || !selectedDate ? (
            <p className="mt-4 rounded-xl border border-dashed border-line px-3.5 py-3 text-xs text-ink-subtle">
              Selecciona un médico y una fecha para consultar sus horarios.
            </p>
          ) : null}
          {isAvailabilityLoading ? <SlotLoadingState /> : null}
          {availabilityQuery.isError ? (
            <div className="mt-4">
              <FormAlert message={getAppointmentErrorMessage(availabilityQuery.error, "No pudimos consultar la disponibilidad.")} />
            </div>
          ) : null}
          {!isAvailabilityLoading && !availabilityQuery.isError && isAvailabilityRequested && freeSlots.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-line px-3.5 py-3 text-xs leading-5 text-ink-muted">
              Este médico no tiene slots libres para la fecha seleccionada. Prueba con otro día.
            </p>
          ) : null}
          {!isAvailabilityLoading && !availabilityQuery.isError && freeSlots.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {freeSlots.map((slot) => {
                const time = toTimeInputValue(slot)
                const isSelected = time === selectedStartTime

                return (
                  <button
                    aria-pressed={isSelected}
                    className={isSelected
                      ? "min-h-10 rounded-xl border border-brand bg-brand px-2 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)]"
                      : "min-h-10 rounded-xl border border-line bg-panel-raised px-2 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-brand-strong"}
                    key={slot}
                    onClick={() => setValue("startTime", time, { shouldDirty: true, shouldValidate: true })}
                    type="button"
                  >
                    {formatAppointmentSlot(slot)}
                  </button>
                )
              })}
            </div>
          ) : null}
          {errors.startTime?.message ? <div className="mt-3"><FieldError id="appointment-start-time-error" message={errors.startTime.message} /></div> : null}
        </div>
      </FormSection>

      <FormSection
        description="Las notas ayudan a orientar la recepción y quedan asociadas a la cita."
        title="Notas de la cita"
      >
        <div className="relative">
          <FileText aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-ink-subtle" />
          <textarea
            {...register("notes")}
            aria-describedby={errors.notes ? "appointment-notes-error" : undefined}
            aria-invalid={Boolean(errors.notes)}
            className="min-h-28 w-full resize-y rounded-xl border border-line bg-panel-raised py-3 pl-10 pr-3.5 text-sm leading-5 text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
            id="appointment-notes"
            placeholder="Motivo de consulta o indicaciones para recepción"
            rows={4}
          />
          {errors.notes?.message ? <FieldError id="appointment-notes-error" message={errors.notes.message} /> : null}
        </div>
      </FormSection>

      <div className="border-t border-line/70 pt-5">
        <SubmitButton isSubmitting={isSubmitting}>
          Programar cita
        </SubmitButton>
      </div>
    </form>
  )
}

function SlotLoadingState() {
  return (
    <div aria-busy="true" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[0, 1, 2, 3].map((slot) => <span className="h-10 animate-pulse rounded-xl bg-line/60" key={slot} />)}
    </div>
  )
}

function AppointmentInput({
  error,
  id,
  label,
  registration,
  ...inputProps
}: {
  error?: string
  id: string
  label: string
  min?: string
  registration?: UseFormRegisterReturn
  type?: string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>{label}</label>
      <input
        {...registration}
        {...inputProps}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
        id={id}
      />
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}

function AppointmentSelect({
  children,
  error,
  id,
  label,
  registration,
}: {
  children: ReactNode
  error?: string
  id: string
  label: string
  registration?: UseFormRegisterReturn
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>{label}</label>
      <select
        {...registration}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
        id={id}
      >
        {children}
      </select>
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}
