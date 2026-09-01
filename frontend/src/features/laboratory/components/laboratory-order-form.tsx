import { zodResolver } from "@hookform/resolvers/zod"
import { FileHeart, FileText, Search } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useForm, type SubmitHandler, type UseFormRegisterReturn } from "react-hook-form"

import { FieldError, FormAlert, FormErrorSummary, FormSection, SubmitButton } from "@/features/auth/components/form-controls"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"
import type { Doctor } from "@/features/doctors/types"
import { formatDoctorName } from "@/features/doctors/utils/doctor-formatting"
import { laboratoryOrderFormSchema, type LaboratoryOrderFormValues } from "@/features/laboratory/schemas/laboratory-schemas"
import type { Patient } from "@/features/patients/types"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"
import { formatLaboratoryTestType } from "@/features/laboratory/utils/laboratory-formatting"

interface LaboratoryOrderFormProps {
  doctors: readonly Doctor[]
  initialDoctorId?: string
  initialMedicalRecordId?: string
  initialPatientId?: string
  onSubmit: SubmitHandler<LaboratoryOrderFormValues>
  patients: readonly Patient[]
  serverError?: string | null
  testTypes: readonly string[]
}

export function LaboratoryOrderForm({
  doctors,
  initialDoctorId,
  initialMedicalRecordId,
  initialPatientId,
  onSubmit,
  patients,
  serverError,
  testTypes,
}: LaboratoryOrderFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LaboratoryOrderFormValues>({
    defaultValues: {
      doctorId: initialDoctorId ?? "",
      medicalRecordId: initialMedicalRecordId ?? "",
      patientId: initialPatientId ?? "",
      testType: "",
    },
    mode: "onBlur",
    resolver: zodResolver(laboratoryOrderFormSchema),
    shouldFocusError: true,
  })
  const [patientSearch, setPatientSearch] = useState("")
  const activePatients = patients.filter((patient) => patient.isActive)
  const selectedPatient = initialPatientId ? patients.find((patient) => patient.id === initialPatientId) : undefined
  const normalizedSearch = patientSearch.trim().toLocaleLowerCase("es")
  const matchingPatients = activePatients.filter((patient) => {
    if (!normalizedSearch) {
      return true
    }

    return `${formatPatientName(patient)} ${patient.personalData.documentId}`.toLocaleLowerCase("es").includes(normalizedSearch)
  })
  const patientOptions = selectedPatient && !matchingPatients.some((patient) => patient.id === selectedPatient.id)
    ? [selectedPatient, ...matchingPatients]
    : matchingPatients
  const activeDoctors = doctors.filter((doctor) => doctor.isActive)
  const selectedDoctor = initialDoctorId ? doctors.find((doctor) => doctor.id === initialDoctorId) : undefined
  const doctorOptions = selectedDoctor && !activeDoctors.some((doctor) => doctor.id === selectedDoctor.id)
    ? [selectedDoctor, ...activeDoctors]
    : activeDoctors
  const validationMessages = getFormErrorMessages(errors)

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormErrorSummary messages={validationMessages} />
      {serverError ? <FormAlert message={serverError} /> : null}
      <FormSection description="Selecciona al paciente y al médico que solicita el examen." title="Contexto de la orden">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-ink" htmlFor="laboratory-patient-search">Buscar paciente</label>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input aria-label="Buscar paciente para orden de laboratorio" className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id="laboratory-patient-search" onChange={(event) => setPatientSearch(event.target.value)} placeholder="Nombre o documento" type="search" value={patientSearch} />
            </div>
            <LaboratorySelect error={errors.patientId?.message} id="laboratory-patient" label="Paciente" registration={register("patientId")}>
              <option value="">Selecciona un paciente</option>
              {patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{formatPatientName(patient)} · {patient.personalData.documentId}</option>)}
              {patientOptions.length === 0 ? <option disabled value="">No encontramos pacientes activos</option> : null}
            </LaboratorySelect>
          </div>
          <LaboratorySelect error={errors.doctorId?.message} id="laboratory-doctor" label="Médico solicitante" registration={register("doctorId")}>
            <option value="">Selecciona un médico</option>
            {doctorOptions.map((doctor) => <option key={doctor.id} value={doctor.id}>{formatDoctorName(doctor)} · {doctor.specialty}</option>)}
          </LaboratorySelect>
        </div>
        {activePatients.length === 0 ? <p className="text-xs leading-5 text-ink-muted">No hay pacientes activos disponibles para crear una orden.</p> : null}
        {activeDoctors.length === 0 ? <p className="text-xs leading-5 text-ink-muted">No hay médicos activos disponibles para crear una orden.</p> : null}
      </FormSection>

      <FormSection description="El tipo se envía como el enum soportado por el backend." title="Prueba solicitada">
        <LaboratorySelect error={errors.testType?.message} id="laboratory-test-type" label="Tipo de examen" registration={register("testType")}>
          <option value="">Selecciona una prueba</option>
          {testTypes.map((testType) => <option key={testType} value={testType}>{formatLaboratoryTestType(testType)}</option>)}
        </LaboratorySelect>
        {testTypes.length === 0 ? <p className="mt-2 text-xs text-ink-muted">El catálogo no tiene pruebas disponibles en este momento.</p> : null}
      </FormSection>

      <FormSection description="Opcional. Permite enlazar la solicitud con el expediente que originó la indicación." title="Referencia clínica">
        <div className="relative">
          <label className="mb-2 block text-xs font-semibold text-ink" htmlFor="laboratory-medical-record">ID del expediente clínico <span className="font-normal text-ink-subtle">(opcional)</span></label>
          <FileHeart aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-ink-subtle" />
          <input {...register("medicalRecordId")} aria-describedby="laboratory-record-hint" className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id="laboratory-medical-record" placeholder="ID del expediente clínico (opcional)" />
        </div>
        <p className="text-[0.68rem] leading-5 text-ink-subtle" id="laboratory-record-hint">Si llegaste desde un expediente, este campo ya estará prellenado.</p>
        {initialMedicalRecordId ? <p className="flex items-start gap-2 text-xs leading-5 text-brand-strong"><FileText aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />Orden contextual originada desde el expediente <span className="break-all font-mono">{initialMedicalRecordId}</span>.</p> : null}
      </FormSection>

      <div className="border-t border-line/70 pt-5"><SubmitButton isSubmitting={isSubmitting}>Crear orden de laboratorio</SubmitButton></div>
    </form>
  )
}

function LaboratorySelect({ children, error, id, label, registration }: { children: ReactNode; error?: string; id: string; label: string; registration?: UseFormRegisterReturn }) {
  return <div className="space-y-2"><label className="block text-xs font-semibold text-ink" htmlFor={id}>{label}</label><select {...registration} aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id={id}>{children}</select>{error ? <FieldError id={`${id}-error`} message={error} /> : null}</div>
}
