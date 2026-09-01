import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useEffect, type ReactNode } from "react"
import {
  useFieldArray,
  useForm,
  useWatch,
  type SubmitHandler,
  type UseFormRegisterReturn,
} from "react-hook-form"

import {
  FieldError,
  FormAlert,
  FormErrorSummary,
  FormSection,
  SubmitButton,
} from "@/features/auth/components/form-controls"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"
import { DOCTOR_DAYS } from "@/features/doctors/utils/doctor-formatting"
import { getDoctorFormDefaultValues } from "@/features/doctors/utils/doctor-form"
import { doctorFormSchema, type DoctorFormValues } from "@/features/doctors/schemas/doctor-schemas"
import type { Doctor } from "@/features/doctors/types"

interface DoctorFormProps {
  doctor?: Doctor
  mode: "create" | "edit"
  onSubmit: SubmitHandler<DoctorFormValues>
  serverError?: string | null
}

export function DoctorForm({ doctor, mode, onSubmit, serverError }: DoctorFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<DoctorFormValues>({
    defaultValues: getDoctorFormDefaultValues(doctor),
    mode: "onBlur",
    resolver: zodResolver(doctorFormSchema),
    shouldFocusError: true,
  })
  const { append, fields, remove } = useFieldArray({ control, name: "schedule" })
  const watchedSchedule = useWatch({ control, name: "schedule" }) ?? []

  useEffect(() => {
    reset(getDoctorFormDefaultValues(doctor))
  }, [doctor, reset])

  const validationMessages = getFormErrorMessages(errors)
  const scheduleError = typeof errors.schedule?.message === "string" ? errors.schedule.message : undefined

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormErrorSummary messages={validationMessages} />
      {serverError ? <FormAlert message={serverError} /> : null}

      <FormSection
        description="Estos datos identifican al especialista dentro de la operación clínica."
        title="Perfil profesional"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DoctorInput
            autoComplete="given-name"
            error={errors.firstName?.message}
            id="doctor-first-name"
            label="Nombre"
            placeholder="Nombre del médico"
            registration={register("firstName")}
          />
          <DoctorInput
            autoComplete="family-name"
            error={errors.lastName?.message}
            id="doctor-last-name"
            label="Apellido"
            placeholder="Apellido del médico"
            registration={register("lastName")}
          />
          <DoctorInput
            error={errors.specialty?.message}
            id="doctor-specialty"
            label="Especialidad"
            placeholder="Ej. Medicina General"
            registration={register("specialty")}
          />
          <DoctorInput
            error={errors.licenseNumber?.message}
            id="doctor-license-number"
            label="Número de licencia médica"
            placeholder="Ej. LIC-2026-001"
            registration={register("licenseNumber")}
          />
          <DoctorInput
            error={errors.office?.message}
            id="doctor-office"
            label="Consultorio"
            placeholder="Ej. Consultorio 108"
            registration={register("office")}
          />
          <DoctorInput
            error={errors.experienceYears?.message}
            id="doctor-experience-years"
            label="Años de experiencia"
            min={0}
            registration={register("experienceYears", { valueAsNumber: true })}
            type="number"
          />
        </div>
      </FormSection>

      <FormSection
        description="Define los turnos disponibles. Cada turno debe tener una hora de inicio anterior a la hora de fin."
        title="Agenda semanal"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">Puedes agregar más de un turno para el mismo día.</p>
          <button
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-brand/30 bg-brand-soft/60 px-3 py-2 text-xs font-semibold text-brand-strong transition-colors hover:border-brand/50 hover:bg-brand-soft"
            onClick={() => append({ day: "Monday", endTime: "12:00", startTime: "08:00" })}
            type="button"
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            Agregar turno
          </button>
        </div>
        {fields.length > 0 ? (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const shiftErrors = errors.schedule?.[index]
              const selectedDay = watchedSchedule[index]?.day ?? field.day

              return (
                <div className="rounded-2xl border border-line/80 bg-canvas/45 p-4" key={field.id}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold text-ink">Turno {index + 1}</p>
                    <button
                      aria-label={`Eliminar turno ${index + 1}`}
                      className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-rose-soft hover:text-rose-strong focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                      title={fields.length === 1 ? "Debe quedar al menos un turno" : "Eliminar turno"}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-3">
                    <DoctorSelect
                      error={shiftErrors?.day?.message}
                      id={`doctor-schedule-${index}-day`}
                      label="Día"
                      registration={register(`schedule.${index}.day`)}
                    >
                      {DOCTOR_DAYS.map((day) => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </DoctorSelect>
                    <DoctorInput
                      error={shiftErrors?.startTime?.message}
                      id={`doctor-schedule-${index}-start`}
                      label="Hora de inicio"
                      registration={register(`schedule.${index}.startTime`)}
                      type="time"
                    />
                    <DoctorInput
                      error={shiftErrors?.endTime?.message}
                      id={`doctor-schedule-${index}-end`}
                      label="Hora de fin"
                      registration={register(`schedule.${index}.endTime`)}
                      type="time"
                    />
                  </div>
                  {selectedDay ? null : <p className="mt-2 text-xs text-ink-subtle">Selecciona un día para este turno.</p>}
                </div>
              )
            })}
          </div>
        ) : null}
        {scheduleError ? <FieldError id="doctor-schedule-error" message={scheduleError} /> : null}
      </FormSection>

      {mode === "edit" ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line/80 bg-canvas/45 px-4 py-3">
          <input
            {...register("isActive")}
            className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
            type="checkbox"
          />
          <span>
            <span className="block text-sm font-medium text-ink">Médico activo</span>
            <span className="mt-0.5 block text-xs leading-5 text-ink-muted">
              Los médicos inactivos permanecen registrados, pero no deben considerarse disponibles.
            </span>
          </span>
        </label>
      ) : null}

      <div className="border-t border-line/70 pt-5">
        <SubmitButton isSubmitting={isSubmitting}>
          {mode === "create" ? "Registrar médico" : "Guardar cambios"}
        </SubmitButton>
      </div>
    </form>
  )
}

function DoctorInput({
  error,
  id,
  label,
  registration,
  ...inputProps
}: {
  autoComplete?: string
  error?: string
  id: string
  label: string
  min?: number
  placeholder?: string
  registration?: UseFormRegisterReturn
  type?: string
}) {
  const descriptionId = error ? `${id}-error` : undefined

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>{label}</label>
      <input
        {...registration}
        {...inputProps}
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
        id={id}
      />
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}

function DoctorSelect({
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
  const descriptionId = error ? `${id}-error` : undefined

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>{label}</label>
      <select
        {...registration}
        aria-describedby={descriptionId}
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
