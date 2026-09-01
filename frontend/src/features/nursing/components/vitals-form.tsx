import { zodResolver } from "@hookform/resolvers/zod"
import { Activity, FileText, Search } from "lucide-react"
import { useState, type ReactNode } from "react"
import {
  useForm,
  useWatch,
  type SubmitHandler,
  type UseFormRegisterReturn,
} from "react-hook-form"

import { FieldError, FormAlert, FormErrorSummary, FormSection, SubmitButton } from "@/features/auth/components/form-controls"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"
import type { Patient } from "@/features/patients/types"
import { nursingVitalsFormSchema, type NursingVitalsFormValues } from "@/features/nursing/schemas/nursing-vitals-schemas"

interface VitalsFormProps {
  appointmentId?: string
  initialPatientId?: string
  onSubmit: SubmitHandler<NursingVitalsFormValues>
  patients: readonly Patient[]
  serverError?: string | null
}

export function VitalsForm({ appointmentId, initialPatientId, onSubmit, patients, serverError }: VitalsFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<NursingVitalsFormValues>({
    defaultValues: {
      appointmentId: appointmentId ?? "",
      bloodPressure: "",
      heartRate: "",
      notes: "",
      patientId: initialPatientId ?? "",
      temperature: "",
      weightKg: "",
    },
    mode: "onBlur",
    resolver: zodResolver(nursingVitalsFormSchema),
    shouldFocusError: true,
  })
  const [patientSearch, setPatientSearch] = useState("")
  const selectedPatientId = useWatch({ control, name: "patientId" }) ?? ""
  const activePatients = patients.filter((patient) => patient.isActive)
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId)
  const normalizedPatientSearch = patientSearch.trim().toLocaleLowerCase("es")
  const matchingPatients = activePatients.filter((patient) => {
    if (!normalizedPatientSearch) {
      return true
    }

    return `${formatPatientName(patient)} ${patient.personalData.documentId}`
      .toLocaleLowerCase("es")
      .includes(normalizedPatientSearch)
  })
  const patientOptions = selectedPatient && !matchingPatients.some((patient) => patient.id === selectedPatient.id)
    ? [selectedPatient, ...matchingPatients]
    : matchingPatients
  const validationMessages = getFormErrorMessages(errors)

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormErrorSummary messages={validationMessages} />
      {serverError ? <FormAlert message={serverError} /> : null}

      <FormSection
        description="Selecciona al paciente antes de registrar los valores. El profesional que registra se deriva de la sesión autenticada."
        title="Paciente"
      >
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-ink" htmlFor="vitals-patient-search">Buscar paciente</label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              aria-label="Buscar paciente para signos vitales"
              className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
              id="vitals-patient-search"
              onChange={(event) => setPatientSearch(event.target.value)}
              placeholder="Nombre o documento"
              type="search"
              value={patientSearch}
            />
          </div>
          <VitalsSelect
            error={errors.patientId?.message}
            id="vitals-patient"
            label="Paciente"
            registration={register("patientId")}
          >
            <option value="">Selecciona un paciente</option>
            {patientOptions.map((patient) => (
              <option key={patient.id} value={patient.id}>{formatPatientName(patient)} · {patient.personalData.documentId}</option>
            ))}
            {patientOptions.length === 0 ? <option disabled value="">No encontramos pacientes activos</option> : null}
          </VitalsSelect>
          {activePatients.length === 0 ? <p className="text-xs leading-5 text-ink-muted">No hay pacientes activos disponibles para registrar signos vitales.</p> : null}
        </div>
        <input {...register("appointmentId")} type="hidden" />
        {appointmentId ? (
          <p className="flex items-start gap-2.5 rounded-2xl border border-brand/20 bg-brand-soft/55 px-4 py-3 text-xs leading-5 text-ink-muted">
            <Activity aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />
            Los valores quedarán asociados a la cita <span className="break-all font-mono font-semibold text-ink">{appointmentId}</span>.
          </p>
        ) : null}
      </FormSection>

      <FormSection
        description="Registra uno o más valores observados durante la atención. Las unidades permanecen visibles para evitar ambigüedad."
        title="Signos vitales"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <VitalsInput
            error={errors.bloodPressure?.message}
            hint="Ejemplo: 120/80 mmHg"
            id="vitals-blood-pressure"
            label="Presión arterial"
            placeholder="120/80"
            registration={register("bloodPressure")}
          />
          <VitalsInput
            error={errors.heartRate?.message}
            hint="Unidad: bpm"
            id="vitals-heart-rate"
            label="Frecuencia cardiaca"
            min="0"
            placeholder="72"
            registration={register("heartRate")}
            type="number"
          />
          <VitalsInput
            error={errors.temperature?.message}
            hint="Unidad: °C"
            id="vitals-temperature"
            label="Temperatura"
            min="0"
            placeholder="36.7"
            registration={register("temperature")}
            step="0.1"
            type="number"
          />
          <VitalsInput
            error={errors.weightKg?.message}
            hint="Unidad: kg"
            id="vitals-weight"
            label="Peso"
            min="0"
            placeholder="72.4"
            registration={register("weightKg")}
            step="0.1"
            type="number"
          />
        </div>
      </FormSection>

      <FormSection description="Añade el contexto de la medición sin interpretar clínicamente los valores desde esta pantalla." title="Notas de enfermería">
        <div className="relative">
          <label className="mb-2 block text-xs font-semibold text-ink" htmlFor="vitals-notes">Notas de enfermería</label>
          <FileText aria-hidden="true" className="pointer-events-none absolute left-3.5 top-[2.65rem] h-4 w-4 text-ink-subtle" />
          <textarea
            {...register("notes")}
            aria-describedby={errors.notes ? "vitals-notes-error" : undefined}
            aria-invalid={Boolean(errors.notes)}
            className="min-h-28 w-full resize-y rounded-xl border border-line bg-panel-raised py-3 pl-10 pr-3.5 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
            id="vitals-notes"
            placeholder="Contexto de la medición o notas de seguimiento"
            rows={4}
          />
          {errors.notes?.message ? <FieldError id="vitals-notes-error" message={errors.notes.message} /> : null}
        </div>
      </FormSection>

      <div className="border-t border-line/70 pt-5">
        <SubmitButton isSubmitting={isSubmitting}>Registrar signos vitales</SubmitButton>
      </div>
    </form>
  )
}

function VitalsInput({ error, hint, id, label, registration, ...inputProps }: {
  error?: string
  hint?: string
  id: string
  label: string
  min?: string
  placeholder?: string
  registration?: UseFormRegisterReturn
  step?: string
  type?: string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>{label}</label>
      <input
        {...registration}
        {...inputProps}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={Boolean(error)}
        className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
        id={id}
      />
      {hint && !error ? <p className="text-[0.68rem] leading-5 text-ink-subtle" id={`${id}-hint`}>{hint}</p> : null}
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}

function VitalsSelect({ children, error, id, label, registration }: {
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
