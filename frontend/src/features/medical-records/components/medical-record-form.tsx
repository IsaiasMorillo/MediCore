import { zodResolver } from "@hookform/resolvers/zod"
import { FileCheck2, Search, ShieldCheck } from "lucide-react"
import { useState, type ReactNode } from "react"
import {
  useForm,
  useWatch,
  type SubmitHandler,
  type UseFormRegisterReturn,
} from "react-hook-form"

import { FieldError, FormAlert, FormErrorSummary, FormSection, SubmitButton } from "@/features/auth/components/form-controls"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"
import { medicalRecordFormSchema, type MedicalRecordFormValues } from "@/features/medical-records/schemas/medical-record-schemas"
import type { Doctor } from "@/features/doctors/types"
import { formatDoctorName } from "@/features/doctors/utils/doctor-formatting"
import type { Patient } from "@/features/patients/types"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"

interface MedicalRecordFormProps {
  appointmentId?: string
  doctors: readonly Doctor[]
  initialDoctorId?: string
  initialPatientId?: string
  onSubmit: SubmitHandler<MedicalRecordFormValues>
  patients: readonly Patient[]
  serverError?: string | null
}

export function MedicalRecordForm({
  appointmentId,
  doctors,
  initialDoctorId,
  initialPatientId,
  onSubmit,
  patients,
  serverError,
}: MedicalRecordFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<MedicalRecordFormValues>({
    defaultValues: {
      appointmentId: appointmentId ?? "",
      bloodPressure: "",
      diagnosis: "",
      doctorId: initialDoctorId ?? "",
      heartRate: "",
      observations: "",
      patientId: initialPatientId ?? "",
      reviewed: false,
      temperature: "",
      treatmentPlan: "",
      weightKg: "",
    },
    mode: "onBlur",
    resolver: zodResolver(medicalRecordFormSchema),
    shouldFocusError: true,
  })
  const [patientSearch, setPatientSearch] = useState("")
  const selectedPatientId = useWatch({ control, name: "patientId" }) ?? ""
  const activeDoctors = doctors.filter((doctor) => doctor.isActive)
  const selectedDoctor = doctors.find((doctor) => doctor.id === initialDoctorId)
  const doctorOptions = selectedDoctor && !activeDoctors.some((doctor) => doctor.id === selectedDoctor.id)
    ? [selectedDoctor, ...activeDoctors]
    : activeDoctors
  const normalizedPatientSearch = patientSearch.trim().toLocaleLowerCase("es")
  const matchingPatients = patients.filter((patient) => {
    if (!normalizedPatientSearch) {
      return true
    }

    return `${formatPatientName(patient)} ${patient.personalData.documentId}`
      .toLocaleLowerCase("es")
      .includes(normalizedPatientSearch)
  })
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId)
  const patientOptions = selectedPatient && !matchingPatients.some((patient) => patient.id === selectedPatient.id)
    ? [selectedPatient, ...matchingPatients]
    : matchingPatients
  const validationMessages = getFormErrorMessages(errors)

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormErrorSummary messages={validationMessages} />
      {serverError ? <FormAlert message={serverError} /> : null}

      <FormSection
        description="Relaciona el registro con el paciente y el profesional responsable. No se solicita el usuario que lo registra porque el backend lo deriva de la sesión."
        title="Contexto clínico"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-ink" htmlFor="medical-record-patient-search">Buscar paciente</label>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input
                aria-label="Buscar paciente para expediente"
                className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
                id="medical-record-patient-search"
                onChange={(event) => setPatientSearch(event.target.value)}
                placeholder="Nombre o documento"
                type="search"
                value={patientSearch}
              />
            </div>
            <MedicalSelect
              error={errors.patientId?.message}
              id="medical-record-patient"
              label="Paciente"
              registration={register("patientId")}
            >
              <option value="">Selecciona un paciente</option>
              {patientOptions.map((patient) => (
                <option key={patient.id} value={patient.id}>{formatPatientName(patient)} · {patient.personalData.documentId}</option>
              ))}
              {patientOptions.length === 0 ? <option disabled value="">No encontramos pacientes</option> : null}
            </MedicalSelect>
          </div>
          <MedicalSelect
            error={errors.doctorId?.message}
            id="medical-record-doctor"
            label="Médico responsable"
            registration={register("doctorId")}
          >
            <option value="">Selecciona un médico</option>
            {doctorOptions.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>{formatDoctorName(doctor)} · {doctor.specialty}</option>
            ))}
          </MedicalSelect>
        </div>
        <input {...register("appointmentId")} type="hidden" />
        {appointmentId ? (
          <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand-soft/55 px-4 py-3">
            <FileCheck2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />
            <p className="text-xs leading-5 text-ink-muted">Este expediente se asociará a la cita <span className="font-mono font-semibold text-ink">{appointmentId}</span>.</p>
          </div>
        ) : null}
      </FormSection>

      <FormSection
        description="Registra los valores disponibles sin convertirlos en una interpretación automática."
        title="Signos vitales"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <MedicalInput
            error={errors.bloodPressure?.message}
            hint="Ejemplo: 120/80 mmHg"
            id="medical-record-blood-pressure"
            label="Presión arterial"
            placeholder="120/80"
            registration={register("bloodPressure")}
          />
          <MedicalInput
            error={errors.heartRate?.message}
            hint="Unidad: bpm"
            id="medical-record-heart-rate"
            label="Frecuencia cardiaca"
            min="0"
            placeholder="72"
            registration={register("heartRate")}
            type="number"
          />
          <MedicalInput
            error={errors.temperature?.message}
            hint="Unidad: °C"
            id="medical-record-temperature"
            label="Temperatura"
            min="0"
            placeholder="36.7"
            registration={register("temperature")}
            step="0.1"
            type="number"
          />
          <MedicalInput
            error={errors.weightKg?.message}
            hint="Unidad: kg"
            id="medical-record-weight"
            label="Peso"
            min="0"
            placeholder="72.4"
            registration={register("weightKg")}
            step="0.1"
            type="number"
          />
        </div>
      </FormSection>

      <FormSection description="Describe el diagnóstico clínico que queda asentado en este registro." title="Diagnóstico">
        <MedicalTextArea
          error={errors.diagnosis?.message}
          id="medical-record-diagnosis"
          label="Diagnóstico"
          placeholder="Diagnóstico o impresión clínica"
          registration={register("diagnosis")}
        />
      </FormSection>

      <FormSection description="Separa los hallazgos observados de las indicaciones posteriores." title="Observaciones">
        <MedicalTextArea
          error={errors.observations?.message}
          id="medical-record-observations"
          label="Observaciones clínicas"
          placeholder="Hallazgos, evolución y observaciones relevantes"
          registration={register("observations")}
        />
      </FormSection>

      <FormSection description="Registra las indicaciones que orientarán la continuidad de la atención." title="Plan de tratamiento">
        <MedicalTextArea
          error={errors.treatmentPlan?.message}
          id="medical-record-treatment-plan"
          label="Plan de tratamiento"
          placeholder="Medicamentos, recomendaciones o próximos pasos"
          registration={register("treatmentPlan")}
        />
      </FormSection>

      <div className="space-y-4 border-t border-line/70 pt-5">
        <div className="flex items-start gap-3 rounded-2xl border border-amber/25 bg-amber-soft/65 px-4 py-3.5" role="note">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-strong" />
          <p className="text-xs leading-5 text-ink">
            Los expedientes clínicos son registros médicos y deben verificarse antes de su creación. Después de guardarlos no se pueden editar desde MediCore.
          </p>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line/80 bg-canvas/45 px-4 py-3">
          <input {...register("reviewed")} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" type="checkbox" />
          <span className="text-xs leading-5 text-ink-muted">He verificado la información clínica y confirmo que está lista para registrarse.</span>
        </label>
        {errors.reviewed?.message ? <FieldError id="medical-record-reviewed-error" message={errors.reviewed.message} /> : null}
      </div>

      <SubmitButton isSubmitting={isSubmitting}>Crear expediente clínico</SubmitButton>
    </form>
  )
}

function MedicalInput({
  error,
  hint,
  id,
  label,
  registration,
  ...inputProps
}: {
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

function MedicalSelect({ children, error, id, label, registration }: {
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

function MedicalTextArea({ error, id, label, placeholder, registration }: {
  error?: string
  id: string
  label: string
  placeholder?: string
  registration?: UseFormRegisterReturn
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>{label}</label>
      <textarea
        {...registration}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="min-h-28 w-full resize-y rounded-xl border border-line bg-panel-raised px-3.5 py-3 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
        id={id}
        placeholder={placeholder}
        rows={4}
      />
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}
