import { ArrowLeft, ClipboardCheck, ShieldCheck } from "lucide-react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import type { SubmitHandler } from "react-hook-form"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert } from "@/features/auth/components/form-controls"
import { MedicalRecordForm } from "@/features/medical-records/components/medical-record-form"
import { useCreateMedicalRecord } from "@/features/medical-records/hooks/use-medical-records"
import { type MedicalRecordFormValues, parseOptionalNumber } from "@/features/medical-records/schemas/medical-record-schemas"
import { getMedicalRecordErrorMessage } from "@/features/medical-records/utils/medical-record-errors"
import { useDoctors } from "@/features/doctors/hooks/use-doctors"
import { usePatients } from "@/features/patients/hooks/use-patients"

export function MedicalRecordCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const patientsQuery = usePatients("")
  const doctorsQuery = useDoctors({})
  const createMutation = useCreateMedicalRecord()
  const initialPatientId = getOptionalQueryValue(searchParams.get("patientId"))
  const initialDoctorId = getOptionalQueryValue(searchParams.get("doctorId"))
  const appointmentId = getOptionalQueryValue(searchParams.get("appointmentId"))
  const hasResourceError = patientsQuery.isError || doctorsQuery.isError
  const isLoadingResources = patientsQuery.isPending || doctorsQuery.isPending

  const handleSubmit: SubmitHandler<MedicalRecordFormValues> = async (values) => {
    try {
      const result = await createMutation.mutateAsync({
        appointmentId: values.appointmentId || null,
        diagnosis: values.diagnosis,
        doctorId: values.doctorId,
        observations: values.observations,
        patientId: values.patientId,
        treatmentPlan: values.treatmentPlan,
        vitalSigns: {
          bloodPressure: values.bloodPressure,
          heartRate: parseOptionalNumber(values.heartRate),
          temperature: parseOptionalNumber(values.temperature),
          weightKg: parseOptionalNumber(values.weightKg),
        },
      })

      navigate(`/app/medical-records/${result.id}`, { replace: true })
    } catch {
      // The mutation state renders the server response below the page header.
    }
  }

  return (
    <div className="space-y-7">
      <Link
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none"
        to={initialPatientId ? `/app/medical-records/patient/${initialPatientId}` : "/app/medical-records/search"}
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        {initialPatientId ? "Volver al historial" : "Volver a expedientes"}
      </Link>
      <PageHeader
        description="Registra la información clínica verificada. Una vez creado, el expediente queda protegido contra ediciones posteriores."
        eyebrow="Clínica · Nuevo expediente"
        title="Crear expediente clínico"
      />

      {createMutation.isError ? <FormAlert message={getMedicalRecordErrorMessage(createMutation.error, "No pudimos crear el expediente clínico.")} /> : null}
      {isLoadingResources ? <MedicalRecordResourcesLoadingState /> : null}
      {hasResourceError ? (
        <MedicalRecordResourcesErrorState
          message={getMedicalRecordErrorMessage(patientsQuery.error ?? doctorsQuery.error, "No pudimos cargar los pacientes y médicos necesarios.")}
          onRetry={() => void Promise.all([patientsQuery.refetch(), doctorsQuery.refetch()])}
        />
      ) : null}
      {!isLoadingResources && !hasResourceError ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
            <MedicalRecordForm
              appointmentId={appointmentId}
              doctors={doctorsQuery.data ?? []}
              initialDoctorId={initialDoctorId}
              initialPatientId={initialPatientId}
              onSubmit={handleSubmit}
              patients={patientsQuery.data ?? []}
              serverError={null}
            />
          </section>
          <ClinicalRecordGuidance appointmentId={appointmentId} />
        </div>
      ) : null}
    </div>
  )
}

function ClinicalRecordGuidance({ appointmentId }: { appointmentId?: string }) {
  return (
    <aside className="h-fit rounded-[1.35rem] border border-line/80 bg-ink p-5 text-white shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-brand-soft">
        <ClipboardCheck aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-soft">Registro irreversible</p>
      <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em]">Verifica antes de guardar</h2>
      <ul className="mt-4 space-y-3 text-xs leading-5 text-white/65">
        <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-soft" />Confirma la identidad del paciente y el médico responsable.</li>
        <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-soft" />Distingue los hallazgos de las indicaciones del tratamiento.</li>
        <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-soft" />El servidor registra la consulta en UTC y conserva el expediente sin edición.</li>
      </ul>
      {appointmentId ? (
        <div className="mt-5 flex items-start gap-2 border-t border-white/10 pt-4 text-[0.68rem] leading-5 text-white/50">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Este registro se asociará a la cita indicada en el contexto del formulario.
        </div>
      ) : null}
    </aside>
  )
}

function MedicalRecordResourcesLoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
      <div className="h-[52rem] animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" />
      <div className="h-72 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" />
    </div>
  )
}

function MedicalRecordResourcesErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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

function getOptionalQueryValue(value: string | null) {
  const normalizedValue = value?.trim()
  return normalizedValue || undefined
}
