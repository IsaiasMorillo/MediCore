import { ArrowLeft, ClipboardCheck, ShieldCheck } from "lucide-react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import type { SubmitHandler } from "react-hook-form"

import { PageHeader } from "@/components/layout/page-header"
import { FormAlert } from "@/features/auth/components/form-controls"
import { useCreateVitalsRecord } from "@/features/nursing/hooks/use-nursing"
import { VitalsForm } from "@/features/nursing/components/vitals-form"
import { type NursingVitalsFormValues, parseOptionalNumber } from "@/features/nursing/schemas/nursing-vitals-schemas"
import { getNursingErrorMessage } from "@/features/nursing/utils/nursing-errors"
import { usePatients } from "@/features/patients/hooks/use-patients"

export function NursingVitalsCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const patientsQuery = usePatients("")
  const createMutation = useCreateVitalsRecord()
  const initialPatientId = getOptionalQueryValue(searchParams.get("patientId"))
  const appointmentId = getOptionalQueryValue(searchParams.get("appointmentId"))
  const isLoading = patientsQuery.isPending

  const handleSubmit: SubmitHandler<NursingVitalsFormValues> = async (values) => {
    try {
      await createMutation.mutateAsync({
        appointmentId: values.appointmentId || null,
        notes: values.notes,
        patientId: values.patientId,
        vitalSigns: {
          bloodPressure: values.bloodPressure,
          heartRate: parseOptionalNumber(values.heartRate),
          temperature: parseOptionalNumber(values.temperature),
          weightKg: parseOptionalNumber(values.weightKg),
        },
      })

      navigate(`/app/nursing?patientId=${encodeURIComponent(values.patientId)}`, { replace: true })
    } catch {
      // The mutation state renders the server response below the page header.
    }
  }

  return (
    <div className="space-y-7">
      <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none" to={initialPatientId ? `/app/nursing?patientId=${encodeURIComponent(initialPatientId)}` : "/app/nursing"}>
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Volver a enfermería
      </Link>
      <PageHeader
        description="Registra una medición clínica puntual con unidades visibles. El profesional que registra se obtiene de la sesión autenticada."
        eyebrow="Clínica · Nueva medición"
        title="Registrar signos vitales"
      />

      {createMutation.isError ? <FormAlert message={getNursingErrorMessage(createMutation.error, "No pudimos registrar los signos vitales.")} /> : null}
      {isLoading ? <VitalsResourcesLoadingState /> : null}
      {patientsQuery.isError ? <VitalsResourcesErrorState message={getNursingErrorMessage(patientsQuery.error, "No pudimos cargar los pacientes.")} onRetry={() => void patientsQuery.refetch()} /> : null}
      {!isLoading && !patientsQuery.isError ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
            <VitalsForm appointmentId={appointmentId} initialPatientId={initialPatientId} onSubmit={handleSubmit} patients={patientsQuery.data ?? []} serverError={null} />
          </section>
          <VitalsGuidance appointmentId={appointmentId} />
        </div>
      ) : null}
    </div>
  )
}

function VitalsGuidance({ appointmentId }: { appointmentId?: string }) {
  return (
    <aside className="h-fit rounded-[1.35rem] border border-line/80 bg-ink p-5 text-white shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-brand-soft"><ClipboardCheck aria-hidden="true" className="h-5 w-5" /></span>
      <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-soft">Captura compacta</p>
      <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em]">Registra lo observado</h2>
      <ul className="mt-4 space-y-3 text-xs leading-5 text-white/65">
        <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-soft" />Puedes registrar uno o más valores; no es necesario completar campos que no fueron medidos.</li>
        <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-soft" />Usa las notas para describir el contexto, no para diagnosticar automáticamente.</li>
        <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-soft" />La fecha y el profesional se asignan en el servidor.</li>
      </ul>
      {appointmentId ? <div className="mt-5 flex items-start gap-2 border-t border-white/10 pt-4 text-[0.68rem] leading-5 text-white/50"><ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />La medición quedará vinculada a la cita seleccionada.</div> : null}
    </aside>
  )
}

function VitalsResourcesLoadingState() {
  return <div aria-busy="true" aria-live="polite" className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]"><div className="h-[42rem] animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /><div className="h-72 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" /></div>
}

function VitalsResourcesErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="flex min-h-64 flex-col items-center justify-center rounded-[1.35rem] border border-rose/20 bg-rose-soft/45 px-6 py-12 text-center" role="alert"><p className="text-sm font-semibold text-ink">No pudimos preparar el formulario</p><p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p><button className="mt-5 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button">Intentar nuevamente</button></div>
}

function getOptionalQueryValue(value: string | null) {
  const normalizedValue = value?.trim()
  return normalizedValue || undefined
}
