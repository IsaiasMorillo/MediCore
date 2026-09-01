import { ArrowUpRight, ClipboardList, Plus } from "lucide-react"
import { Link } from "react-router-dom"

import { FormAlert } from "@/features/auth/components/form-controls"
import { ClinicalRecordTimeline } from "@/features/medical-records/components/clinical-record-timeline"
import { usePatientMedicalRecords } from "@/features/medical-records/hooks/use-medical-records"
import { getMedicalRecordErrorMessage } from "@/features/medical-records/utils/medical-record-errors"

export function PatientMedicalRecordsPanel({ patientId }: { patientId: string }) {
  const recordsQuery = usePatientMedicalRecords(patientId)
  const records = recordsQuery.data ?? []

  return (
    <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
            <ClipboardList aria-hidden="true" className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold tracking-[-0.025em] text-ink">Historial clínico</h2>
            <p className="mt-1 text-xs leading-5 text-ink-muted">Registros médicos inmutables ordenados desde la consulta más reciente.</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel-raised px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink"
            to={`/app/medical-records/new?patientId=${encodeURIComponent(patientId)}`}
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            Nuevo registro
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-strong transition-colors hover:bg-brand-soft/70"
            to={`/app/medical-records/patient/${patientId}`}
          >
            Ver historial
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {recordsQuery.isPending ? <PanelLoadingState /> : null}
      {recordsQuery.isError ? (
        <div className="mt-5">
          <FormAlert message={getMedicalRecordErrorMessage(recordsQuery.error, "No pudimos cargar el historial clínico.")} />
          <button className="mt-4 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={() => void recordsQuery.refetch()} type="button">
            Intentar nuevamente
          </button>
        </div>
      ) : null}
      {!recordsQuery.isPending && !recordsQuery.isError ? (
        <div className="mt-5">
          <ClinicalRecordTimeline limit={3} records={records} />
          {records.length > 3 ? <p className="mt-3 text-right text-[0.68rem] text-ink-subtle">Mostrando los 3 registros más recientes.</p> : null}
        </div>
      ) : null}
    </section>
  )
}

function PanelLoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="mt-5 space-y-3">
      {[0, 1].map((item) => <div className="h-28 animate-pulse rounded-2xl border border-line/70 bg-canvas/45" key={item} />)}
    </div>
  )
}
