import { ArrowLeft, FileHeart, FlaskConical, ShieldCheck } from "lucide-react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import type { SubmitHandler } from "react-hook-form"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert } from "@/features/auth/components/form-controls"
import { useDoctors } from "@/features/doctors/hooks/use-doctors"
import { LaboratoryOrderForm } from "@/features/laboratory/components/laboratory-order-form"
import { useCreateLaboratoryOrder, useLaboratoryTestTypes } from "@/features/laboratory/hooks/use-laboratory"
import type { LaboratoryOrderFormValues } from "@/features/laboratory/schemas/laboratory-schemas"
import { getLaboratoryErrorMessage } from "@/features/laboratory/utils/laboratory-errors"
import { usePatients } from "@/features/patients/hooks/use-patients"

export function LaboratoryOrderCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const patientsQuery = usePatients("")
  const doctorsQuery = useDoctors({})
  const testTypesQuery = useLaboratoryTestTypes()
  const createMutation = useCreateLaboratoryOrder()
  const initialPatientId = getOptionalQueryValue(searchParams.get("patientId"))
  const initialDoctorId = getOptionalQueryValue(searchParams.get("doctorId"))
  const initialMedicalRecordId = getOptionalQueryValue(searchParams.get("medicalRecordId"))
  const hasResourceError = patientsQuery.isError || doctorsQuery.isError || testTypesQuery.isError
  const isLoadingResources = patientsQuery.isPending || doctorsQuery.isPending || testTypesQuery.isPending
  const testTypes = testTypesQuery.data?.supported ?? []

  const handleSubmit: SubmitHandler<LaboratoryOrderFormValues> = async (values) => {
    try {
      const result = await createMutation.mutateAsync({
        doctorId: values.doctorId,
        medicalRecordId: values.medicalRecordId || null,
        patientId: values.patientId,
        testType: values.testType,
      })

      navigate(`/app/laboratory/orders/${result.id}`, { replace: true })
    } catch {
      // The mutation state renders the server response below the page header.
    }
  }

  return (
    <div className="space-y-7">
      <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none" to={initialPatientId ? `/app/laboratory?patientId=${encodeURIComponent(initialPatientId)}` : "/app/laboratory"}><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />Volver a laboratorio</Link>
      <PageHeader description="Solicita una prueba con el catálogo respaldado por el backend. Puedes originarla desde un expediente clínico." eyebrow="Clínica · Nueva orden" title="Crear orden de laboratorio" />
      {createMutation.isError ? <FormAlert message={getLaboratoryErrorMessage(createMutation.error, "No pudimos crear la orden de laboratorio.")} /> : null}
      {isLoadingResources ? <LaboratoryOrderResourcesLoadingState /> : null}
      {hasResourceError ? <LaboratoryOrderResourcesErrorState message={getLaboratoryErrorMessage(patientsQuery.error ?? doctorsQuery.error ?? testTypesQuery.error, "No pudimos cargar el catálogo y las referencias necesarias.")} onRetry={() => void Promise.all([patientsQuery.refetch(), doctorsQuery.refetch(), testTypesQuery.refetch()])} /> : null}
      {!isLoadingResources && !hasResourceError ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6"><LaboratoryOrderForm doctors={doctorsQuery.data ?? []} initialDoctorId={initialDoctorId} initialMedicalRecordId={initialMedicalRecordId} initialPatientId={initialPatientId} onSubmit={handleSubmit} patients={patientsQuery.data ?? []} serverError={null} testTypes={testTypes} /></section>
          <LaboratoryOrderGuidance medicalRecordId={initialMedicalRecordId} />
        </div>
      ) : null}
    </div>
  )
}

function LaboratoryOrderGuidance({ medicalRecordId }: { medicalRecordId?: string }) {
  return <aside className="h-fit rounded-[1.35rem] border border-line/80 bg-ink p-5 text-white shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-brand-soft"><FlaskConical aria-hidden="true" className="h-5 w-5" /></span><p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-soft">Solicitud trazable</p><h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em]">Antes de ordenar</h2><ul className="mt-4 space-y-3 text-xs leading-5 text-white/65"><li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-soft" />Confirma el paciente y el médico solicitante.</li><li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-soft" />Elige una prueba del catálogo real, sin escribir valores libres.</li><li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-soft" />El resultado se cargará después desde el flujo de laboratorio.</li></ul>{medicalRecordId ? <p className="mt-5 flex items-start gap-2 border-t border-white/10 pt-4 text-[0.68rem] leading-5 text-white/50"><FileHeart aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />La orden conserva la referencia al expediente clínico de origen.</p> : <p className="mt-5 flex items-start gap-2 border-t border-white/10 pt-4 text-[0.68rem] leading-5 text-white/50"><ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />La referencia al expediente es opcional.</p>}</aside>
}

function LaboratoryOrderResourcesLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]"><div className="h-[42rem] animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /><div className="h-72 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /></div>
}

function LaboratoryOrderResourcesErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="flex min-h-64 flex-col items-center justify-center rounded-[1.35rem] border border-rose/20 bg-rose-soft/45 px-6 py-12 text-center" role="alert"><p className="text-sm font-semibold text-ink">No pudimos preparar la orden</p><p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p><button className="mt-5 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button">Intentar nuevamente</button></div>
}

function getOptionalQueryValue(value: string | null) {
  const normalizedValue = value?.trim()
  return normalizedValue || undefined
}
