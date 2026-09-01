import { ArrowUpRight, ClipboardList, FileText, Stethoscope } from "lucide-react"
import { Link } from "react-router-dom"

import type { MedicalRecord } from "@/features/medical-records/types"
import {
  formatMedicalRecordDate,
  formatVitalSignsSummary,
  listClinicalValues,
  sortMedicalRecords,
} from "@/features/medical-records/utils/medical-record-formatting"
import type { PatientClinicalHistory } from "@/features/patients/types"

export function ClinicalRecordTimeline({
  limit,
  records,
}: {
  limit?: number
  records: readonly MedicalRecord[]
}) {
  const sortedRecords = sortMedicalRecords(records)
  const visibleRecords = typeof limit === "number" ? sortedRecords.slice(0, limit) : sortedRecords

  if (visibleRecords.length === 0) {
    return (
      <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-8 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
          <ClipboardList aria-hidden="true" className="h-4 w-4" />
        </span>
        <p className="mt-3 text-sm font-semibold text-ink">No hay expedientes clínicos</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">
          El historial aparecerá aquí cuando se cree el primer registro médico.
        </p>
      </div>
    )
  }

  return (
    <ol className="relative space-y-5 before:absolute before:bottom-5 before:left-[0.9rem] before:top-5 before:w-px before:bg-line/80">
      {visibleRecords.map((record) => (
        <li className="relative pl-9" key={record.id}>
          <span className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-panel bg-brand text-white shadow-sm">
            <Stethoscope aria-hidden="true" className="h-3 w-3" />
          </span>
          <article className="rounded-2xl border border-line/80 bg-panel-raised p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-brand-strong">
                  {formatMedicalRecordDate(record.consultationDate)}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-ink">{record.diagnosis}</h3>
              </div>
              <Link
                aria-label={`Abrir registro ${record.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none"
                to={`/app/medical-records/${record.id}`}
              >
                Abrir registro
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
              <Stethoscope aria-hidden="true" className="h-3.5 w-3.5 text-brand-strong" />
              Médico responsable · <span className="font-mono text-[0.68rem]">{record.doctorId}</span>
            </p>
            <dl className="mt-4 grid gap-3 border-t border-line/70 pt-4 sm:grid-cols-2">
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">Signos vitales</dt>
                <dd className="mt-1 text-xs leading-5 text-ink-muted">{formatVitalSignsSummary(record.vitalSigns)}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">Plan de tratamiento</dt>
                <dd className="mt-1 line-clamp-2 text-xs leading-5 text-ink-muted">{record.treatmentPlan || "No registrado"}</dd>
              </div>
            </dl>
          </article>
        </li>
      ))}
    </ol>
  )
}

export function ClinicalHistorySnapshot({ history }: { history: PatientClinicalHistory }) {
  const groups = [
    { label: "Alergias", values: history.allergies },
    { label: "Enfermedades crónicas", values: history.chronicDiseases },
    { label: "Medicamentos actuales", values: history.currentMedications },
    { label: "Antecedentes familiares", values: history.familyHistory },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {groups.map((group) => {
        const values = listClinicalValues(group.values)

        return (
          <div className="rounded-2xl border border-line/70 bg-canvas/45 p-4" key={group.label}>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">{group.label}</p>
            {values.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {values.map((value) => (
                  <li className="flex items-start gap-2 text-xs leading-5 text-ink" key={value}>
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-ink-subtle">Sin información registrada.</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ClinicalRecordSection({ title, value }: { title: string; value: string }) {
  return (
    <section className="rounded-2xl border border-line/70 bg-canvas/45 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
        <FileText aria-hidden="true" className="h-4 w-4 text-brand-strong" />
        {title}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-muted">{value || "No registrado"}</p>
    </section>
  )
}
