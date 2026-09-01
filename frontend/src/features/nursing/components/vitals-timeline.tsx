import { Activity, CalendarClock, FileText, Link2, UserRound } from "lucide-react"
import { Link } from "react-router-dom"

import type { VitalsRecord } from "@/features/nursing/types"
import {
  formatVitalSign,
  formatVitalSignsSummary,
  formatVitalsRecordDate,
  sortVitalsRecords,
} from "@/features/nursing/utils/nursing-formatting"

export function VitalsSummary({ record }: { record: VitalsRecord }) {
  const metrics = [
    { label: "Presión arterial", value: record.vitalSigns.bloodPressure ? `${record.vitalSigns.bloodPressure} mmHg` : "No registrada" },
    { label: "Frecuencia cardiaca", value: formatVitalSign(record.vitalSigns.heartRate, "bpm") },
    { label: "Temperatura", value: formatVitalSign(record.vitalSigns.temperature, "°C") },
    { label: "Peso", value: formatVitalSign(record.vitalSigns.weightKg, "kg") },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article className="rounded-2xl border border-line/70 bg-canvas/45 p-4" key={metric.label}>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">{metric.label}</p>
          <p className="mt-2 text-sm font-semibold text-ink">{metric.value}</p>
        </article>
      ))}
    </div>
  )
}

export function VitalsTimeline({ limit, records }: { limit?: number; records: readonly VitalsRecord[] }) {
  const sortedRecords = sortVitalsRecords(records)
  const visibleRecords = typeof limit === "number" ? sortedRecords.slice(0, limit) : sortedRecords

  if (visibleRecords.length === 0) {
    return (
      <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-8 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><Activity aria-hidden="true" className="h-4 w-4" /></span>
        <p className="mt-3 text-sm font-semibold text-ink">No hay signos vitales registrados</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">Los valores capturados durante la atención aparecerán aquí, ordenados por fecha.</p>
      </div>
    )
  }

  return (
    <ol className="relative space-y-5 before:absolute before:bottom-5 before:left-[0.9rem] before:top-5 before:w-px before:bg-line/80 before:content-['']">
      {visibleRecords.map((record) => (
        <li className="relative pl-9" key={record.id}>
          <span className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-panel bg-brand text-white shadow-sm"><Activity aria-hidden="true" className="h-3 w-3" /></span>
          <article className="rounded-2xl border border-line/80 bg-panel-raised p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-brand-strong">{formatVitalsRecordDate(record.recordedAt)}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted"><UserRound aria-hidden="true" className="h-3.5 w-3.5 text-brand-strong" />Registrado por <span className="font-mono text-[0.68rem]">{record.recordedBy}</span></p>
              </div>
              {record.appointmentId ? <Link className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand" to={`/app/appointments/${record.appointmentId}`}><Link2 aria-hidden="true" className="h-3.5 w-3.5" />Ver cita</Link> : null}
            </div>
            <div className="mt-4 grid gap-3 border-t border-line/70 pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">Valores registrados</p>
                <p className="mt-1.5 text-sm leading-6 text-ink">{formatVitalSignsSummary(record.vitalSigns)}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle"><FileText aria-hidden="true" className="h-3.5 w-3.5" />Notas</p>
                <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-ink-muted">{record.notes || "Sin notas registradas."}</p>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ol>
  )
}

export function VitalsTrendStrip({ records }: { records: readonly VitalsRecord[] }) {
  const recentRecords = sortVitalsRecords(records).slice(0, 6).reverse()
  const trends = [
    { getValue: (record: VitalsRecord) => record.vitalSigns.heartRate, label: "Frecuencia cardiaca", unit: "bpm" },
    { getValue: (record: VitalsRecord) => record.vitalSigns.temperature, label: "Temperatura", unit: "°C" },
    { getValue: (record: VitalsRecord) => record.vitalSigns.weightKg, label: "Peso", unit: "kg" },
  ]
    .map((trend) => ({ ...trend, values: recentRecords.map((record) => trend.getValue(record)).filter((value): value is number => value !== null && value !== undefined) }))
    .filter((trend) => trend.values.length >= 2)

  if (trends.length === 0) {
    return null
  }

  return (
    <section className="rounded-2xl border border-line/70 bg-canvas/45 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><CalendarClock aria-hidden="true" className="h-4 w-4" /></span>
        <div>
          <h3 className="text-sm font-semibold text-ink">Secuencia reciente</h3>
          <p className="mt-1 text-xs leading-5 text-ink-muted">Solo muestra la sucesión de valores registrados; no representa una interpretación clínica.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {trends.map((trend) => <VitalsTrend key={trend.label} label={trend.label} unit={trend.unit} values={trend.values} />)}
      </div>
    </section>
  )
}

function VitalsTrend({ label, unit, values }: { label: string; unit: string; values: readonly number[] }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = values.map((value, index) => `${index * (100 / Math.max(values.length - 1, 1))},${28 - ((value - min) / range) * 22}`).join(" ")
  const latestValue = values[values.length - 1]

  return (
    <div className="rounded-xl border border-line/70 bg-panel-raised px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-subtle">{label}</p>
        <span className="text-xs font-semibold text-ink">{formatVitalSign(latestValue, unit)}</span>
      </div>
      <svg aria-label={`${label}: ${values.length} valores registrados`} className="mt-3 h-8 w-full overflow-visible text-brand" preserveAspectRatio="none" role="img" viewBox="0 0 100 32">
        <polyline fill="none" points={points} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}
