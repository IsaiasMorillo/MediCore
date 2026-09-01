import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, Pill, Search } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useForm, useWatch, type SubmitHandler, type UseFormRegisterReturn } from "react-hook-form"

import { FieldError, FormAlert, FormErrorSummary, FormSection, SubmitButton } from "@/features/auth/components/form-controls"
import { getFormErrorMessages } from "@/features/auth/utils/form-errors"
import type { Doctor } from "@/features/doctors/types"
import { formatDoctorName } from "@/features/doctors/utils/doctor-formatting"
import { prescriptionFormSchema, type PrescriptionFormValues } from "@/features/pharmacy/schemas/pharmacy-schemas"
import type { Medication } from "@/features/pharmacy/types"
import { formatPharmacyCurrency } from "@/features/pharmacy/utils/pharmacy-formatting"
import { MedicationStockBadge } from "@/features/pharmacy/utils/pharmacy-status"
import type { Patient } from "@/features/patients/types"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"

interface PrescriptionFormProps {
  doctors: readonly Doctor[]
  initialDoctorId?: string
  initialMedicalRecordId?: string
  initialPatientId?: string
  medications: readonly Medication[]
  onSubmit: SubmitHandler<PrescriptionFormValues>
  patients: readonly Patient[]
  serverError?: string | null
}

export function PrescriptionForm({
  doctors,
  initialDoctorId,
  initialMedicalRecordId,
  initialPatientId,
  medications,
  onSubmit,
  patients,
  serverError,
}: PrescriptionFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<PrescriptionFormValues>({
    defaultValues: {
      dosage: "",
      doctorId: initialDoctorId ?? "",
      frequency: "",
      instructions: "",
      medicalRecordId: initialMedicalRecordId ?? "",
      medicationId: "",
      patientId: initialPatientId ?? "",
      quantity: 1,
    },
    mode: "onBlur",
    resolver: zodResolver(prescriptionFormSchema),
    shouldFocusError: true,
  })
  const selectedPatientId = useWatch({ control, name: "patientId" }) ?? ""
  const selectedMedicationId = useWatch({ control, name: "medicationId" }) ?? ""
  const [patientSearch, setPatientSearch] = useState("")
  const [medicationSearch, setMedicationSearch] = useState("")
  const activePatients = patients.filter((patient) => patient.isActive)
  const activeDoctors = doctors.filter((doctor) => doctor.isActive)
  const activeMedications = medications.filter((medication) => medication.isActive)
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId)
  const selectedMedication = activeMedications.find((medication) => medication.id === selectedMedicationId)
  const normalizedPatientSearch = patientSearch.trim().toLocaleLowerCase("es")
  const normalizedMedicationSearch = medicationSearch.trim().toLocaleLowerCase("es")
  const matchingPatients = activePatients.filter((patient) => `${formatPatientName(patient)} ${patient.personalData.documentId}`.toLocaleLowerCase("es").includes(normalizedPatientSearch))
  const matchingMedications = activeMedications.filter((medication) => `${medication.name} ${medication.code} ${medication.category}`.toLocaleLowerCase("es").includes(normalizedMedicationSearch))
  const patientOptions = selectedPatient && !matchingPatients.some((patient) => patient.id === selectedPatient.id) ? [selectedPatient, ...matchingPatients] : matchingPatients
  const medicationOptions = selectedMedication && !matchingMedications.some((medication) => medication.id === selectedMedication.id) ? [selectedMedication, ...matchingMedications] : matchingMedications
  const validationMessages = getFormErrorMessages(errors)

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormErrorSummary messages={validationMessages} />
      {serverError ? <FormAlert message={serverError} /> : null}

      <FormSection description="Una receta queda asociada al paciente, al médico y opcionalmente al expediente desde el que se originó." title="Contexto de la receta">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-ink" htmlFor="prescription-patient-search">Buscar paciente</label>
            <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" /><input aria-label="Buscar paciente para receta" className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id="prescription-patient-search" onChange={(event) => setPatientSearch(event.target.value)} placeholder="Nombre o documento" type="search" value={patientSearch} /></div>
            <PrescriptionSelect error={errors.patientId?.message} id="prescription-patient" label="Paciente" registration={register("patientId")}>
              <option value="">Selecciona un paciente</option>
              {patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{formatPatientName(patient)} · {patient.personalData.documentId}</option>)}
              {patientOptions.length === 0 ? <option disabled value="">No encontramos pacientes activos</option> : null}
            </PrescriptionSelect>
          </div>
          <PrescriptionSelect error={errors.doctorId?.message} id="prescription-doctor" label="Médico prescriptor" registration={register("doctorId")}>
            <option value="">Selecciona un médico</option>
            {activeDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{formatDoctorName(doctor)} · {doctor.specialty}</option>)}
          </PrescriptionSelect>
        </div>
        <input {...register("medicalRecordId")} type="hidden" />
        {initialMedicalRecordId ? <p className="flex items-start gap-2.5 rounded-2xl border border-brand/20 bg-brand-soft/55 px-4 py-3 text-xs leading-5 text-ink-muted"><FileText aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />Esta receta se asociará al expediente <span className="break-all font-mono font-semibold text-ink">{initialMedicalRecordId}</span>.</p> : null}
        {activeDoctors.length === 0 || activePatients.length === 0 ? <p className="text-xs leading-5 text-ink-muted">Necesitas al menos un paciente y un médico activo para crear la receta.</p> : null}
      </FormSection>

      <FormSection description="Selecciona un medicamento activo del catálogo real. La cantidad recetada se validará también en el servidor." title="Medicamento e indicaciones">
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-ink" htmlFor="prescription-medication-search">Buscar medicamento</label>
          <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" /><input aria-label="Buscar medicamento para receta" className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id="prescription-medication-search" onChange={(event) => setMedicationSearch(event.target.value)} placeholder="Nombre, código o categoría" type="search" value={medicationSearch} /></div>
          <PrescriptionSelect error={errors.medicationId?.message} id="prescription-medication" label="Medicamento" registration={register("medicationId")}>
            <option value="">Selecciona un medicamento</option>
            {medicationOptions.map((medication) => <option key={medication.id} value={medication.id}>{medication.name} · {medication.code}</option>)}
            {medicationOptions.length === 0 ? <option disabled value="">No encontramos medicamentos activos</option> : null}
          </PrescriptionSelect>
          {selectedMedication ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 bg-canvas/45 px-3.5 py-3"><div><p className="text-xs font-semibold text-ink">{selectedMedication.name}</p><p className="mt-0.5 text-[0.68rem] text-ink-muted">Precio unitario: {formatPharmacyCurrency(selectedMedication.price)} · Stock: {selectedMedication.stockQuantity} unidades</p></div><MedicationStockBadge medication={selectedMedication} /></div> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <PrescriptionInput error={errors.dosage?.message} id="prescription-dosage" label="Dosis" placeholder="Ej. 1 tableta" registration={register("dosage")} />
          <PrescriptionInput error={errors.frequency?.message} id="prescription-frequency" label="Frecuencia" placeholder="Ej. Cada 12 horas" registration={register("frequency")} />
          <PrescriptionInput error={errors.quantity?.message} id="prescription-quantity" label="Cantidad" min="1" registration={register("quantity", { valueAsNumber: true })} step="1" type="number" />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-ink" htmlFor="prescription-instructions">Instrucciones</label>
          <textarea {...register("instructions")} aria-describedby={errors.instructions ? "prescription-instructions-error" : undefined} aria-invalid={Boolean(errors.instructions)} className="min-h-28 w-full resize-y rounded-xl border border-line bg-panel-raised px-3.5 py-3 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id="prescription-instructions" placeholder="Indicaciones para el paciente o farmacia" rows={4} />
          {errors.instructions?.message ? <FieldError id="prescription-instructions-error" message={errors.instructions.message} /> : null}
        </div>
      </FormSection>

      <div className="flex items-start gap-3 rounded-2xl border border-amber/25 bg-amber-soft/65 px-4 py-3.5" role="note"><Pill aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-strong" /><p className="text-xs leading-5 text-ink">Verifica paciente, medicamento, dosis, frecuencia y cantidad antes de emitir la receta.</p></div>
      <div className="border-t border-line/70 pt-5"><SubmitButton isSubmitting={isSubmitting}>Emitir receta</SubmitButton></div>
    </form>
  )
}

function PrescriptionInput({ error, id, label, registration, ...inputProps }: {
  error?: string
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
      <input {...registration} {...inputProps} aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id={id} />
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}

function PrescriptionSelect({ children, error, id, label, registration }: {
  children: ReactNode
  error?: string
  id: string
  label: string
  registration?: UseFormRegisterReturn
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>{label}</label>
      <select {...registration} aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10" id={id}>{children}</select>
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}
