import { ArrowLeft, FilePlus2, HeartPulse, UserRound } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { ClinicalHistorySnapshot, ClinicalRecordTimeline } from "@/features/medical-records/components/clinical-record-timeline"
import { usePatientMedicalRecords } from "@/features/medical-records/hooks/use-medical-records"
import { getMedicalRecordErrorMessage } from "@/features/medical-records/utils/medical-record-errors"
import { usePatient } from "@/features/patients/hooks/use-patients"
import { formatPatientName } from "@/features/patients/utils/patient-formatting"

export function PatientMedicalRecordsPage() {
  const { patientId } = useParams()
  const patientQuery = usePatient(patientId)
  const recordsQuery = usePatientMedicalRecords(patientId)

  if (!patientId) {
    return <PatientMedicalRecordsState message="El historial no tiene un identificador de paciente válido." />
  }

  if (patientQuery.isPending || recordsQuery.isPending) {
    return <PatientMedicalRecordsLoadingState />
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <PatientMedicalRecordsState
        message={getMedicalRecordErrorMessage(patientQuery.error, "No pudimos cargar la ficha del paciente.")}
        onRetry={() => void patientQuery.refetch()}
      />
    )
  }

  if (recordsQuery.isError) {
    return (
      <PatientMedicalRecordsState
        message={getMedicalRecordErrorMessage(recordsQuery.error, "No pudimos cargar el historial clínico.")}
        onRetry={() => void recordsQuery.refetch()}
      />
    )
  }

  const patient = patientQuery.data
  const records = recordsQuery.data ?? []
  const patientName = formatPatientName(patient)

  return (
    <div className="space-y-7">
      <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none" to="/app/medical-records/search">
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Volver a búsqueda
      </Link>
      <PageHeader
        actions={
          <>
            <Link className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-3.5 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to={`/app/patients/${patient.id}`}>
              <UserRound aria-hidden="true" className="h-3.5 w-3.5" />
              Ficha del paciente
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong" to={`/app/medical-records/new?patientId=${encodeURIComponent(patient.id)}`}>
              <FilePlus2 aria-hidden="true" className="h-3.5 w-3.5" />
              Nuevo registro
            </Link>
          </>
        }
        description={`Documento ${patient.personalData.documentId}. Consulta los antecedentes y los registros médicos inmutables de ${patientName}.`}
        eyebrow="Clínica · Historial por paciente"
        title={patientName}
      />

      <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
        <div className="flex items-start gap-3 border-b border-line/70 pb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><HeartPulse aria-hidden="true" className="h-4 w-4" /></span>
          <div>
            <h2 className="font-display text-base font-semibold tracking-[-0.025em] text-ink">Resumen clínico inicial</h2>
            <p className="mt-1 text-xs text-ink-muted">Antecedentes registrados en la ficha del paciente.</p>
          </div>
        </div>
        <div className="pt-5"><ClinicalHistorySnapshot history={patient.clinicalHistory} /></div>
      </section>

      <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
        <div className="flex flex-col gap-2 border-b border-line/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Seguimiento clínico</p>
            <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink">Timeline de expedientes</h2>
          </div>
          <p className="text-xs text-ink-muted">{records.length} registro{records.length === 1 ? "" : "s"} médico{records.length === 1 ? "" : "s"}</p>
        </div>
        <div className="pt-5"><ClinicalRecordTimeline records={records} /></div>
      </section>
    </div>
  )
}

function PatientMedicalRecordsLoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="block h-4 w-32 animate-pulse rounded-full bg-line/60" />
      <div className="space-y-3">
        <span className="block h-3 w-36 animate-pulse rounded-full bg-line/60" />
        <span className="block h-10 w-2/3 animate-pulse rounded-xl bg-line/60" />
        <span className="block h-4 w-full max-w-xl animate-pulse rounded-full bg-line/60" />
      </div>
      <div className="h-72 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" />
      <div className="h-96 animate-pulse rounded-[1.35rem] border border-line/70 bg-panel" />
    </div>
  )
}

function PatientMedicalRecordsState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center" role={onRetry ? "alert" : undefined}>
      <p className="text-sm font-semibold text-ink">No pudimos mostrar el historial</p>
      <p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {onRetry ? <button className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button">Intentar nuevamente</button> : null}
        <Link className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" to="/app/medical-records/search">Volver a expedientes</Link>
      </div>
    </div>
  )
}
