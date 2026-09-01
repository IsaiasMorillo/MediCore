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
import { patientFormSchema, type PatientFormValues } from "@/features/patients/schemas/patient-schemas"
import type {
  Patient,
} from "@/features/patients/types"
import { getPatientFormDefaultValues } from "@/features/patients/utils/patient-form"

const contactTypeOptions = [
  { label: "Teléfono", value: "Phone" },
  { label: "Contacto de emergencia", value: "Emergency" },
  { label: "Correo electrónico", value: "Email" },
  { label: "Otro", value: "Other" },
] as const

interface PatientFormProps {
  mode: "create" | "edit"
  patient?: Patient
  serverError?: string | null
  onSubmit: SubmitHandler<PatientFormValues>
}

export function PatientForm({ mode, patient, serverError, onSubmit }: PatientFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<PatientFormValues>({
    defaultValues: getPatientFormDefaultValues(patient),
    mode: "onBlur",
    resolver: zodResolver(patientFormSchema),
    shouldFocusError: true,
  })
  const { append, fields, remove } = useFieldArray({ control, name: "contacts" })
  const watchedContacts = useWatch({ control, name: "contacts" }) ?? []
  const insuranceEnabled = useWatch({ control, name: "insuranceEnabled" })

  useEffect(() => {
    reset(getPatientFormDefaultValues(patient))
  }, [patient, reset])

  const validationMessages = getFormErrorMessages(errors)
  const isBusy = isSubmitting

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormErrorSummary messages={validationMessages} />
      {serverError ? <FormAlert message={serverError} /> : null}

      <FormSection
        description="Estos datos identifican al paciente dentro de MediCore."
        title="Datos personales"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <PatientInput
            autoComplete="given-name"
            error={errors.firstName?.message}
            id="patient-first-name"
            label="Nombre"
            placeholder="Nombre del paciente"
            registration={register("firstName")}
          />
          <PatientInput
            autoComplete="family-name"
            error={errors.lastName?.message}
            id="patient-last-name"
            label="Apellido"
            placeholder="Apellido del paciente"
            registration={register("lastName")}
          />
          <PatientInput
            error={errors.documentId?.message}
            id="patient-document-id"
            label="Documento de identidad"
            placeholder="Ej. 402-1234567-8"
            registration={register("documentId")}
          />
          <PatientInput
            error={errors.dateOfBirth?.message}
            id="patient-date-of-birth"
            label="Fecha de nacimiento"
            registration={register("dateOfBirth")}
            type="date"
          />
          <PatientInput
            error={errors.gender?.message}
            id="patient-gender"
            label="Género"
            placeholder="Ej. Femenino"
            registration={register("gender")}
          />
        </div>
      </FormSection>

      <FormSection
        description="Registra teléfonos, correos u otros medios necesarios para el seguimiento."
        title="Contactos"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            Los contactos son opcionales, pero cada registro agregado debe tener un valor.
          </p>
          <button
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-brand/30 bg-brand-soft/60 px-3 py-2 text-xs font-semibold text-brand-strong transition-colors hover:border-brand/50 hover:bg-brand-soft"
            onClick={() => append({ name: "", phone: "", type: "Phone", value: "" })}
            type="button"
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            Agregar contacto
          </button>
        </div>
        {fields.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-4 py-5 text-center text-xs text-ink-subtle">
            No hay contactos agregados.
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const contactType = watchedContacts[index]?.type ?? field.type
              const contactErrors = errors.contacts?.[index]
              const isEmergency = contactType === "Emergency"

              return (
                <div className="rounded-2xl border border-line/80 bg-canvas/45 p-4" key={field.id}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold text-ink">Contacto {index + 1}</p>
                    <button
                      aria-label={`Eliminar contacto ${index + 1}`}
                      className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-rose-soft hover:text-rose-strong focus-visible:outline-none"
                      onClick={() => remove(index)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <PatientSelect
                      error={contactErrors?.type?.message}
                      id={`patient-contact-${index}-type`}
                      label="Tipo"
                      registration={register(`contacts.${index}.type`)}
                    >
                      {contactTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </PatientSelect>
                    {isEmergency ? (
                      <PatientInput
                        error={contactErrors?.name?.message}
                        id={`patient-contact-${index}-name`}
                        label="Nombre del contacto"
                        placeholder="Persona de contacto"
                        registration={register(`contacts.${index}.name`)}
                      />
                    ) : (
                      <PatientInput
                        error={contactErrors?.value?.message}
                        id={`patient-contact-${index}-value`}
                        label={contactType === "Email" ? "Correo electrónico" : "Teléfono o valor"}
                        placeholder={contactType === "Email" ? "contacto@correo.com" : "809-555-0000"}
                        registration={register(`contacts.${index}.value`)}
                        type={contactType === "Email" ? "email" : "text"}
                      />
                    )}
                    {isEmergency ? (
                      <PatientInput
                        error={contactErrors?.phone?.message}
                        id={`patient-contact-${index}-phone`}
                        label="Teléfono de emergencia"
                        placeholder="809-555-0000"
                        registration={register(`contacts.${index}.phone`)}
                      />
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </FormSection>

      <FormSection
        description="Añade la aseguradora y la póliza solo cuando el paciente tenga cobertura registrada."
        title="Seguro médico"
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line/80 bg-canvas/45 px-4 py-3">
          <input
            {...register("insuranceEnabled")}
            className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
            type="checkbox"
          />
          <span>
            <span className="block text-sm font-medium text-ink">Tiene seguro médico</span>
            <span className="mt-0.5 block text-xs leading-5 text-ink-muted">
              La información puede completarse o actualizarse después.
            </span>
          </span>
        </label>
        {insuranceEnabled ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <PatientInput
              error={errors.insuranceProvider?.message}
              id="patient-insurance-provider"
              label="Aseguradora"
              placeholder="Ej. Senasa"
              registration={register("insuranceProvider")}
            />
            <PatientInput
              error={errors.insurancePolicyNumber?.message}
              id="patient-insurance-policy"
              label="Número de póliza"
              placeholder="Número de póliza"
              registration={register("insurancePolicyNumber")}
            />
            <PatientInput
              error={errors.insuranceCoverageType?.message}
              id="patient-insurance-coverage"
              label="Tipo de cobertura"
              placeholder="Ej. Premium"
              registration={register("insuranceCoverageType")}
            />
          </div>
        ) : null}
      </FormSection>

      <FormSection
        description="Escribe un dato por línea. Estos campos se almacenan como listas dentro del expediente."
        title="Historia clínica inicial"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <PatientTextArea
            error={errors.allergies?.message}
            id="patient-allergies"
            label="Alergias"
            placeholder="Penicilina\nPolvo"
            registration={register("allergies")}
          />
          <PatientTextArea
            error={errors.chronicDiseases?.message}
            id="patient-chronic-diseases"
            label="Enfermedades crónicas"
            placeholder="Hipertensión\nAsma"
            registration={register("chronicDiseases")}
          />
          <PatientTextArea
            error={errors.currentMedications?.message}
            id="patient-current-medications"
            label="Medicamentos actuales"
            placeholder="Losartán 50mg"
            registration={register("currentMedications")}
          />
          <PatientTextArea
            error={errors.familyHistory?.message}
            id="patient-family-history"
            label="Antecedentes familiares"
            placeholder="Diabetes familiar"
            registration={register("familyHistory")}
          />
        </div>
      </FormSection>

      {mode === "edit" ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line/80 bg-canvas/45 px-4 py-3">
          <input
            {...register("isActive")}
            className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
            type="checkbox"
          />
          <span>
            <span className="block text-sm font-medium text-ink">Paciente activo</span>
            <span className="mt-0.5 block text-xs leading-5 text-ink-muted">
              Los pacientes inactivos permanecen en el historial, pero no se consideran activos.
            </span>
          </span>
        </label>
      ) : null}

      <div className="border-t border-line/70 pt-5">
        <SubmitButton isSubmitting={isBusy}>
          {mode === "create" ? "Registrar paciente" : "Guardar cambios"}
        </SubmitButton>
      </div>
    </form>
  )
}

function PatientInput({
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

function PatientSelect({
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

function PatientTextArea({
  error,
  id,
  label,
  placeholder,
  registration,
}: {
  error?: string
  id: string
  label: string
  placeholder?: string
  registration?: UseFormRegisterReturn
}) {
  const descriptionId = error ? `${id}-error` : undefined

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink" htmlFor={id}>{label}</label>
      <textarea
        {...registration}
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className="min-h-24 w-full resize-y rounded-xl border border-line bg-panel-raised px-3.5 py-3 text-sm leading-5 text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
        id={id}
        placeholder={placeholder}
        rows={3}
      />
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  )
}
