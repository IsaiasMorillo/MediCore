import { CalendarClock, FileText } from "lucide-react"

import type { LaboratoryOrder } from "@/features/laboratory/types"
import {
  formatLaboratoryDate,
  formatLaboratoryResultLabel,
  formatLaboratoryResultValue,
  getLaboratoryResultEntries,
} from "@/features/laboratory/utils/laboratory-formatting"

export function LaboratoryResultsViewer({ order }: { order: LaboratoryOrder }) {
  const entries = getLaboratoryResultEntries(order.results)

  if (entries.length === 0) {
    return (
      <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-8 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"><FileText aria-hidden="true" className="h-4 w-4" /></span>
        <p className="mt-3 text-sm font-semibold text-ink">Resultados pendientes</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">Esta orden todavía no tiene resultados cargados por el laboratorio.</p>
      </div>
    )
  }

  return (
    <section className="rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-6">
      <div className="flex flex-col gap-2 border-b border-line/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">Resultados</p>
          <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink">Valores informados por laboratorio</h2>
        </div>
        {order.resultsLoadedAt ? <p className="flex items-center gap-1.5 text-xs text-ink-muted"><CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />{formatLaboratoryDate(order.resultsLoadedAt)}</p> : null}
      </div>
      <dl className="mt-5 divide-y divide-line/70">
        {entries.map(([key, value]) => (
          <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)] sm:gap-5" key={key}>
            <dt className="text-xs font-semibold text-ink-muted">{formatLaboratoryResultLabel(key)}</dt>
            <dd className="whitespace-pre-wrap break-words text-sm leading-6 text-ink">{formatLaboratoryResultValue(value)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 border-t border-line/70 pt-4 text-[0.68rem] leading-5 text-ink-subtle">MediCore muestra los valores recibidos y no agrega rangos de referencia ni interpretación clínica.</p>
    </section>
  )
}
